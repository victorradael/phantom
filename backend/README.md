# Phantom Sync API

Backend de sincronização de workspaces e links para o Phantom.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/)
- Python 3.11+ (apenas para desenvolvimento local sem Docker)

---

## Início Rápido (Docker)

```bash
cd backend
docker compose up
```

A API estará disponível em `http://localhost:8000`.
A documentação interativa (Swagger) em `http://localhost:8000/docs`.

---

## Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste conforme necessário:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@db:5432/phantom` | URL de conexão com o PostgreSQL |
| `DEBUG` | `false` | Habilita logs SQL e modo debug |
| `APP_NAME` | `Phantom Sync API` | Nome da aplicação |

---

## Desenvolvimento Local (sem Docker)

### 1. Instalar dependências

```bash
cd backend
pip install -e ".[dev]"
```

### 2. Subir apenas o banco de dados

```bash
docker compose up db -d
```

### 3. Configurar variável de ambiente

```bash
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/phantom
```

### 4. Rodar as migrações

```bash
alembic upgrade head
```

### 5. Iniciar o servidor

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Migrações (Alembic)

```bash
# Aplicar todas as migrações pendentes
alembic upgrade head

# Reverter a última migração
alembic downgrade -1

# Ver histórico de migrações
alembic history

# Gerar nova migração automaticamente
alembic revision --autogenerate -m "descrição da mudança"
```

> Em desenvolvimento, `init_db()` cria as tabelas automaticamente na inicialização.
> Em produção, use sempre `alembic upgrade head`.

---

## Endpoints

### Health

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Verifica se a API está online |

**Resposta:**
```json
{ "status": "ok", "service": "phantom-sync" }
```

---

### Workspaces

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/workspaces` | Criar workspace |
| `GET` | `/workspaces` | Listar todos os workspaces |
| `GET` | `/workspaces/{id}` | Buscar workspace por ID |
| `PUT` | `/workspaces/{id}` | Atualizar workspace |
| `DELETE` | `/workspaces/{id}` | Deletar workspace (e seus links) |

**Criar workspace:**
```bash
curl -X POST http://localhost:8000/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Meu Workspace"}'
```

---

### Links

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/links` | Criar link |
| `GET` | `/links` | Listar links (filtro opcional por workspace) |
| `GET` | `/links/{id}` | Buscar link por ID |
| `PUT` | `/links/{id}` | Atualizar link |
| `DELETE` | `/links/{id}` | Deletar link |

**Listar links de um workspace:**
```bash
curl http://localhost:8000/links?workspace_id=1
```

**Criar link:**
```bash
curl -X POST http://localhost:8000/links \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com",
    "name": "GitHub",
    "description": "Repositórios",
    "workspace_id": 1
  }'
```

---

### Sync

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/sync` | Sincronizar workspace e links |

O endpoint de sync usa **upsert por UUID**: cria o registro se não existir, atualiza se já existir.

**Payload:**
```json
{
  "workspace": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Meu Workspace"
  },
  "links": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440001",
      "url": "https://github.com",
      "name": "GitHub",
      "description": "Repositórios"
    }
  ]
}
```

**Resposta:**
```json
{
  "workspace_id": 1,
  "synced_links": 1,
  "message": "Synced workspace 'Meu Workspace' with 1 link(s)."
}
```

---

## Estrutura do Projeto

```
backend/
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml          # Dependências e configuração de ferramentas
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py              # Configuração das migrações (async)
│   └── versions/
│       └── 001_initial_schema.py
└── src/
    ├── main.py             # Entrada da aplicação FastAPI
    ├── config.py           # Configurações via variáveis de ambiente
    ├── api/                # Rotas HTTP
    │   ├── workspaces.py
    │   ├── links.py
    │   └── sync.py
    ├── models/             # Modelos SQLAlchemy (ORM)
    │   ├── workspace.py
    │   └── link.py
    ├── schemas/            # Schemas Pydantic (validação)
    │   ├── workspace.py
    │   ├── link.py
    │   └── sync.py
    ├── repositories/       # Queries ao banco de dados
    │   ├── workspace_repo.py
    │   └── link_repo.py
    ├── services/           # Lógica de negócio
    │   ├── workspace_service.py
    │   ├── link_service.py
    │   └── sync_service.py
    └── db/
        └── database.py     # Engine async, sessão e Base declarativa
```

---

## Banco de Dados

### Tabela `workspaces`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `serial` PK | ID interno |
| `uuid` | `uuid` UNIQUE | Identificador global (usado no sync) |
| `name` | `varchar(255)` | Nome do workspace |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Última atualização |

### Tabela `links`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `serial` PK | ID interno |
| `uuid` | `uuid` UNIQUE | Identificador global (usado no sync) |
| `url` | `varchar(2048)` | URL do link |
| `name` | `varchar(255)` | Nome/alias (opcional) |
| `description` | `text` | Descrição (opcional) |
| `workspace_id` | `int` FK | Referência ao workspace |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Última atualização |

---

## Qualidade de Código

```bash
# Linting e formatação
ruff check src/
ruff format src/

# Formatação com Black
black src/

# Verificação de tipos
mypy src/
```

---

## Documentação Interativa

Com a API rodando, acesse:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
