# Spec: Multi-Tenancy

## 1. Objetivo Principal
Implementar arquitetura multi-tenant no backend do Phantom para isolar os dados de diferentes usuários. O sistema deve usar o `tenant_id` recebido via token JWT para garantir que cada proprietário acesse, sincronize e modifique apenas seus próprios workspaces, links e tags, mantendo intactas as regras de negócio existentes da aplicação.

## 2. Requisitos Específicos e Stack Tecnológica
- **Stack:** Python 3.14+, FastAPI, PostgreSQL (via `asyncpg` direto, sem uso de ORM para manipulação em runtime), Alembic para gerenciar migrações de banco (utilizando SQL puro).
- **Extração do Tenant:** Ler e validar um token JWT enviado via header `Authorization: Bearer <token>`. O token conterá a propriedade de identificação do `tenant_id` (tipo `integer`).
- **Banco de Dados:**
  - Adicionar a coluna `tenant_id` (`integer`) nas tabelas `workspaces`, `links` e `tags`.
  - Vincular todos os endpoints da API (List, Create, Update, Delete, Sync) ao `tenant_id` correspondente extraído do token para o isolamento dos dados.
- **Tratamento de Dados Antigos:** A migração do banco de dados deve criar um `tenant_id` padrão (ex: `0` ou `1`) e associar todos os dados pré-existentes a ele. No entanto, requisições externas para a API contendo este tenant padrão deverão ser rejeitadas ou bloqueadas por segurança.

## 3. Exemplos de I/O

**Entrada (Requisição HTTP ao Servidor):**
```http
GET /workspaces HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUz... (Token contém {"tenant_id": 42})
```

**Comportamento Interno (Query adaptada com `asyncpg`):**
```sql
SELECT id, uuid, name, created_at, updated_at 
FROM workspaces 
WHERE tenant_id = $1;
-- $1 será substituído por 42
```

**Saída Esperada (Dados exclusivos do Tenant 42):**
```json
[
  {
    "id": 105,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Workspace Privado do Usuário",
    "created_at": "2026-06-30T10:00:00Z",
    "updated_at": "2026-06-30T10:00:00Z"
  }
]
```

## 4. Restrições (Anti-objetivos)
- **Não utilizar SQLAlchemy ORM para consultas no código de runtime.** A aplicação já funciona utilizando drivers assíncronos diretos com `asyncpg`, e assim deve permanecer para garantir alta performance e alinhamento à arquitetura atual.
- **Não permitir acesso ao "Tenant Padrão" da migração.** Se os dados antigos forem migrados para o `tenant_id` `0` (ou outro valor reservado), o middleware/dependência do FastAPI de validação do JWT deve rejeitar requisições de tokens que requisitem esse mesmo ID para evitar acessos indesejados.
- **Não quebrar a lógica de Upsert do endpoint `/sync`.** A lógica atual baseia-se em UUIDs para atualizar ou inserir registros. Esta lógica deve apenas ser contextualizada adicionando uma validação/cláusula restrita ao tenant autenticado.
- **Não vazar o `tenant_id` nas respostas para os clientes.** O frontend não precisa receber o `tenant_id` nos payloads de resposta, já que o escopo de dados retornado já é garantido como sendo do próprio usuário.

## 5. Etapas de Implementação (Step-by-step)
1. **Configuração da Autenticação via JWT:**
   - Implementar uma dependência (ex: no FastAPI via `Depends()`) capaz de extrair o header `Authorization`.
   - Validar o JWT, extrair a key contendo o `tenant_id` e rejeitar a requisição em caso de tenant padrão reservado, token inválido ou ausente.
2. **Migração do Banco de Dados (`alembic`):**
   - Gerar uma nova revisão no Alembic (`alembic revision -m "add tenant_id to workspaces, links and tags"`).
   - Usar `op.execute()` com queries SQL nativas para adicionar as colunas `tenant_id` (`INTEGER`).
   - Fazer um `UPDATE` das tabelas para preencher o `tenant_id` com um ID reservado (ex: `0`) em todos os registros já existentes e então definir as colunas como `NOT NULL`.
   - Revisar chaves únicas (UNIQUE constraints) envolvendo o `uuid` e decidir se o `tenant_id` deve ser adicionado como chave composta, caso necessário.
3. **Refatoração na Camada de Repositório (`src/repositories/`):**
   - Modificar todas as consultas SQL dos métodos `list`, `create`, `update`, `delete`, `get_by_id` em `workspace_repo.py`, `link_repo.py` e do repositório de tags para aceitar e filtrar pelos resultados do respectivo `tenant_id`.
4. **Adaptação do Endpoint de Sincronização (`src/services/sync_service.py`):**
   - Modificar a instrução UPSERT (`INSERT ... ON CONFLICT ...`) para garantir que os workspaces, links e tags processados e armazenados fiquem presos ao `tenant_id` atual da requisição.
5. **Integração nas Rotas (`src/api/`):**
   - Inserir a dependência de autenticação do JWT nas rotas atuais e passar o `tenant_id` extraído para as camadas de Service e Repository.

## 6. Contexto Adicional
- **Estrutura de Arquivos:** Todo o código backend reside na pasta `backend/`. As rotas HTTP ficam sob `backend/src/api/`, a lógica em `backend/src/services/` e a camada de dados em `backend/src/repositories/`.
- **Validação de Inputs:** Não esquecer de utilizar os schemas Pydantic na pasta `backend/src/schemas/` conforme as boas práticas que já estão implementadas. Alterações neles devem se ater ao necessário para suportar o multi-tenant, sem quebrar os contratos do cliente.

---

## 7. Geração do Token (Backend)

### 7.1 Estratégia
O token JWT é gerado de forma **stateless**: não há tabela de usuários. O operador/admin escolhe um `tenant_id` inteiro positivo qualquer, chama o endpoint de geração e recebe o JWT assinado com o `jwt_secret` configurado no servidor. O backend nunca persiste o token — apenas o valida por assinatura em cada requisição.

### 7.2 Endpoint `POST /admin/tokens`
- **Proteção:** o endpoint exige um header `X-Admin-Secret` cujo valor deve coincidir com a variável de ambiente `ADMIN_SECRET` configurada no servidor. Requisições sem o header ou com valor incorreto recebem `403 Forbidden`.
- **Request body:**
  ```json
  { "tenant_id": 42 }
  ```
- **Validações:**
  - `tenant_id` deve ser um inteiro positivo (`>= 1`).
  - `tenant_id` igual ao valor reservado (`0`) deve ser rejeitado com `422 Unprocessable Entity`.
- **Response (200 OK):**
  ```json
  { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
  ```
- O JWT gerado **não** contém `exp` (sem expiração por padrão), pois o token é tratado como API key de longa duração. O operador pode invalidar todos os tokens trocando o `jwt_secret` no servidor.
- O router é registrado em `src/api/admin.py` e montado em `/admin` no `main.py`.

### 7.3 Configuração necessária no servidor
Adicionar ao `Settings` (e ao `.env`):
```env
ADMIN_SECRET=troque-este-valor-em-producao
```

### 7.4 Exemplo de uso
```http
POST /admin/tokens HTTP/1.1
Host: localhost:8000
X-Admin-Secret: troque-este-valor-em-producao
Content-Type: application/json

{ "tenant_id": 42 }
```
Resposta:
```json
{ "token": "eyJ..." }
```
O operador copia o token retornado e o cola na extensão (ver Seção 8).

---

## 8. Configuração do Token na Extensão (Frontend)

### 8.1 Onde o token é fornecido
O token é colado pelo usuário na **sidebar de configurações de workspaces** (`WorkspaceSidebar`), na mesma seção onde já existe o campo de URL da API (`localApiUrl`). Um novo campo "API Token" é adicionado logo abaixo do campo de URL.

### 8.2 Persistência
O token é armazenado junto com a URL no Electron store, dentro da chave `syncConfig`:
```js
// estrutura atual
{ apiUrl: 'http://...', lastSynced: null }

// estrutura após a mudança
{ apiUrl: 'http://...', apiToken: 'eyJ...', lastSynced: null }
```
A leitura e escrita do `apiToken` seguem o mesmo padrão do `apiUrl`: `window.api.getSyncConfig()` / `window.api.saveSyncConfig(config)`.

### 8.3 Envio nas requisições
Todos os `fetch` realizados em `electron/main.js` que chamam a API do backend devem incluir o header:
```
Authorization: Bearer <apiToken>
```
Isso se aplica a todos os handlers IPC que fazem chamadas HTTP: `test-api-connection`, `pull-sync`, `sync-workspace`, `update-synced-link`, `delete-synced-link`, `delete-synced-workspace`.

### 8.4 Comportamento esperado na UI
- Enquanto o token estiver vazio, o status de conexão permanece `'unconfigured'` (mesmo comportamento atual quando a URL está vazia).
- O botão "Testar Conexão" só deve ser habilitado quando ambos os campos (URL e token) estiverem preenchidos.
- Erros `401` / `403` recebidos do backend devem atualizar o `connectionStatus` para `'disconnected'` e exibir uma mensagem clara ao usuário (ex: _"Token inválido ou sem permissão"_).

### 8.5 Restrições
- **Não armazenar o token em `localStorage` ou qualquer mecanismo acessível ao renderer diretamente.** O store do Electron (main process) é a única fonte de verdade, acessada via IPC (`window.api`).
- **Não exibir o token em texto claro após salvo.** O campo deve ser do tipo `password` (com opção de toggle para exibição temporária), igual a um campo de senha convencional.
