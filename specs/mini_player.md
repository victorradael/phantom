# Spec: Modo Minimizado (Mini Player)

## 1. Objetivo Principal
Criar uma funcionalidade que permita ao usuário alternar para um modo de visualização "minimizada", com estética semelhante aos antigos music players (como os clássicos MP3 players). O objetivo é fornecer uma interface compacta que economize espaço na tela, exibindo apenas as informações essenciais e os controles básicos de reprodução.

## 2. Requisitos Específicos
- **Botão de Ativação:** Deve ser adicionado um botão (ou ícone) na interface principal para alternar para a aparência minimizada.
- **Layout do Mini Player:**
  - O tamanho deve ser compacto, remetendo a um MP3 player.
  - **Esquerda:** Deve exibir o logo da aplicação.
  - **Centro:** Deve exibir informações mínimas da reprodução atual (como nome da música e talvez do artista, preferencialmente com um efeito de letreiro/marquee se o texto for muito longo).
  - **Direita:** Comandos básicos de mídia (Play, Pause, Avançar, Voltar, e o botão para restaurar a janela original).
- **Tecnologias:** Deve seguir a stack atual do projeto (React, Tailwind CSS, Electron/Vite, etc., de acordo com o que já está configurado na aplicação).

## 3. Exemplos de I/O
- **Ação:** Usuário clica no botão "Minimizar Player".
- **Estado/Saída:** Uma variável de estado (ex: `isMiniMode`) muda para `true`. A aplicação altera a renderização principal para exibir apenas a barra compacta do Mini Player. No caso de ambiente Electron, pode envolver o redimensionamento da janela do sistema operacional para o tamanho exato do player.
- **Ação:** Usuário clica no botão "Restaurar" (no Mini Player).
- **Estado/Saída:** O estado `isMiniMode` muda para `false` e a interface completa volta a ser renderizada (e a janela é restaurada, se aplicável).

## 4. Restrições (Anti-objetivos)
- **Não** exibir listas de reprodução (playlists), opções de configuração, ou navegação de biblioteca musical no modo minimizado.
- **Não** alterar o estado da reprodução em si ao transitar entre os modos (a música não deve parar ao minimizar/maximizar).
- **Não** quebrar o layout se o título da música for muito longo.

## 5. Etapas (Step-by-step)
1. **Controle de Estado:** Implementar o gerenciamento de estado (ex: `isMiniPlayerActive`) na raiz da aplicação ou via Context API/Store.
2. **Botão de Toggle:** Adicionar o botão na UI principal para disparar a mudança de estado.
3. **Criação do Componente:** Criar o componente `MiniPlayer` com a estrutura horizontal: Logo (Esquerda), Info da Música (Centro), Controles (Direita).
4. **Estilização:** Aplicar o design compacto simulando os players de MP3 antigos (ex: Winamp reduzido ou iPod nano).
5. **Integração com Electron (se aplicável):** Se a aplicação rodar em desktop, disparar um evento IPC para redimensionar e remover as bordas (frameless) da janela principal ao entrar no modo mini.
6. **Testes de Transição:** Garantir que a troca entre as visões seja fluida e que os controles de reprodução no modo mini funcionem perfeitamente.

## 6. Contexto
Essa funcionalidade requer integração direta com o player de áudio subjacente do repositório atual para sincronizar o estado (isPlaying, currentTrack, etc). Será necessário reutilizar ou adaptar os botões de controle de mídia e a lógica de exibição de tempo já existentes no projeto.
