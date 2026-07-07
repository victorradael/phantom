# Spec: Modo Minimizado (Mini Player Flutuante)

## 1. Objetivo Principal
Criar uma funcionalidade que permita ao usuário alternar o player para um modo de visualização "minimizada" e flutuante. O objetivo é fornecer uma interface compacta (semelhante aos clássicos MP3 players) que economize espaço na tela e permaneça visível ("Always on Top") mesmo quando o usuário estiver fora da visualização principal da aplicação (a visualização de links).

## 2. Requisitos Específicos
- **Botão de Ativação:** Deve ser adicionado um botão (ou ícone) na interface principal para alternar para a aparência minimizada.
- **Comportamento da Janela (Janela Única no Electron):**
  - Ao entrar no modo minimizado, a própria janela principal do sistema operacional deve ser redimensionada para o tamanho exato do player e remover suas bordas (frameless). Nenhuma janela extra deve ser criada.
  - A janela deve ser configurada como **"Always on Top"** (Sempre no topo) para garantir que fique sobreposta a outros aplicativos do sistema operacional (como navegadores ou outros editores), permitindo seu uso fora da visualização dos links.
- **Layout do Mini Player:**
  - O tamanho deve ser compacto.
  - **Esquerda:** Deve exibir o logo da aplicação.
  - **Centro:** Deve exibir informações mínimas da reprodução atual (como nome da música/áudio, com um efeito de letreiro/marquee se o texto for muito longo).
  - **Direita:** Comandos básicos de mídia (Play, Pause, Avançar, Voltar, e o botão para restaurar a janela ao modo original).
- **Tecnologias:** Seguir a stack atual do projeto (React, Tailwind CSS, Electron/Vite).

## 3. Exemplos de I/O
- **Ação:** Usuário clica no botão "Minimizar Player".
- **Estado/Saída:** 
  - O evento IPC é enviado ao processo principal (Electron) para redimensionar a janela, ativá-la como frameless e setar `alwaysOnTop(true)`.
  - O estado da interface (ex: `isMiniMode`) muda para `true`, ocultando a lista de links e exibindo apenas a barra compacta do Mini Player.
- **Ação:** Usuário clica no botão "Restaurar" no Mini Player.
- **Estado/Saída:** 
  - O evento IPC restaura o tamanho original da janela, restaura as bordas e desativa o `alwaysOnTop`.
  - O estado `isMiniMode` muda para `false`, voltando a renderizar a interface completa de links.

## 4. Restrições (Anti-objetivos)
- **Não** exibir a lista de links, opções de configuração, ou outras views complexas no modo minimizado.
- **Não** parar a reprodução em andamento ao transitar entre os modos (a transição deve ser imperceptível no áudio).
- **Não** quebrar o layout se as informações de texto (título) forem muito longas.

## 5. Etapas (Step-by-step)
1. **Controle de Estado:** Implementar o gerenciamento de estado (ex: `isMiniPlayerActive`) na raiz da aplicação.
2. **Integração IPC (Electron):** Criar os handlers no `main` do Electron para redimensionar a janela, alternar a propriedade frameless e o estado `alwaysOnTop`.
3. **Botão de Toggle:** Adicionar o botão na UI principal para disparar a mudança.
4. **Criação do Componente:** Criar o componente `MiniPlayer` com a estrutura: Logo (Esquerda), Info (Centro), Controles (Direita).
5. **Estilização:** Aplicar o design compacto simulando os players de MP3.
6. **Testes de Transição:** Garantir que a troca entre as visões seja fluida e não interrompa a atividade principal.

## 6. Contexto
A aplicação possui uma visualização principal voltada ao gerenciamento e exibição de links. Essa funcionalidade requer que o player atue como um widget flutuante e independente da visualização dos links, utilizando a integração direta com o player já existente no repositório atual para sincronizar o estado (isPlaying, currentTrack, etc). O Electron será fundamental para manipular a janela em nível de sistema operacional (tamanho, alwaysOnTop e frameless).
