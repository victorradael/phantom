# Como Escrever uma Boa Spec para IAs

Para que a IA seja mais assertiva, sua especificação (spec) precisa ser clara, detalhada e sem ambiguidades. Siga as diretrizes abaixo:

## 1. Defina o Objetivo Principal
Comece com um resumo de 1 ou 2 frases explicando o que precisa ser construído e qual o problema ele resolve.

## 2. Seja Específico e Direto
- Evite explicações vagas. Vá direto ao ponto.
- Liste os requisitos funcionais e não funcionais em formato de tópicos.
- Especifique as tecnologias, bibliotecas e frameworks exatos que devem ser utilizados (incluindo versões, se relevante).

## 3. Forneça Exemplos de I/O
- **Entradas e Saídas:** Mostre exemplos exatos de como os dados entram e como devem sair (ex: payloads JSON).
- **Casos de Uso:** Descreva passo a passo como a funcionalidade será utilizada.

## 4. Defina as Restrições (Anti-objetivos)
Dizer à IA o que **não** fazer previne alucinações e otimizações desnecessárias.
- Ex: "Não utilize Tailwind", "Não altere a estrutura do banco de dados atual".

## 5. Divida em Etapas (Step-by-step)
Se a funcionalidade for complexa, quebre a especificação em passos menores (milestones). Isso ajuda a IA a focar em uma coisa de cada vez.

## 6. Dê Contexto
Forneça a estrutura dos arquivos, trechos de código com os quais a IA precisará interagir e regras de negócio essenciais para a integração.

---

### Checklist de Revisão
- [ ] O objetivo final está óbvio?
- [ ] A stack tecnológica foi definida?
- [ ] Existem exemplos de entrada/saída?
- [ ] O que *não deve ser feito* foi documentado?
- [ ] A tarefa está dividida em partes digeríveis?
