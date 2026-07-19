# NODERE — Design System Operacional

Versão: 1.0 — auditoria de 2026-07-18

## Princípios

1. **Decisão antes de decoração:** indicadores devem responder a uma pergunta operacional.
2. **Dados privados nunca são estado de fundo:** validação, erro e conteúdo autenticado são estados mutuamente exclusivos.
3. **Densidade confortável por padrão:** compacto é opção, não requisito para caber.
4. **Cor comunica categoria, não substitui texto.**
5. **Componentes respondem a largura e zoom, não a um único screenshot.**

## Tokens de layout

| Token | Valor de referência | Uso |
|---|---:|---|
| largura de conteúdo | `1680px` máximo | páginas internas |
| sidebar desktop | `15.5rem` | navegação principal |
| topbar | `72px` | busca, usuário e ações globais |
| raio de card | `16px` | painéis e métricas |
| raio de controle | `10px`–`12px` | campos e botões |
| coluna Kanban | `300px`–`330px` mínimo | operação e zoom |
| foco | `2px` verde + offset | teclado |

## Cor e semântica

- Verde: lead, CRM, ação recomendada, sucesso.
- Ciano/azul: busca, informação, score, relatório.
- Laranja/dourado: oportunidade quente, prazo, atenção.
- Vermelho: erro, ausência crítica, ação destrutiva.
- Roxo: propostas, conteúdo ou sinal social.
- Cinza/ardósia: estrutura, texto secundário e estado neutro.

Texto primário deve manter contraste forte no fundo escuro. Texto secundário não deve usar opacidade tão baixa que desapareça em monitor com brilho reduzido. Cor sozinha não define resultado: use rótulo, número ou ícone com nome acessível.

## Tipografia

- Título de página: 28–30px, peso 700/800.
- Título de seção: 18–20px, peso 700.
- Título de card: 13–15px, peso 600/700.
- Corpo: 14–16px.
- Meta/legenda: mínimo 12px, contraste secundário legível.
- Números executivos: 28–36px, alinhamento tabular quando comparados.

## Componentes

### Cabeçalho de página

Um título, uma descrição curta e no máximo duas ações primárias. Busca global permanece na topbar. Ações secundárias vão para menu ou seção contextual.

### Card métrico

Rótulo, valor, contexto curto e ícone semântico. Evite borda colorida em todos os lados; uma nuance de fundo/borda é suficiente. Métricas relacionadas devem ser agrupadas sob um título de seção.

### Botões

- Primário: uma ação principal por contexto.
- Secundário: navegação ou ação reversível.
- Destrutivo: vermelho e confirmação quando houver perda.
- Somente ícone: `aria-label`/`title` e alvo clicável mínimo de 40px quando o espaço permitir.

### Formulários

Rótulo visível, exemplo/ajuda quando o formato não é óbvio, erro junto ao campo e ação de salvar previsível. Segredos nunca entram em campos ou bundles públicos.

### Kanban

Cabeçalho mostra etapa, contagem e valor. Cards exibem apenas dados necessários à próxima decisão. Colunas usam rolagem vertical própria e snap horizontal. Alteração estrutural fica em **Personalizar funil**, recolhida por padrão.

### Estados

- Carregando: mensagem curta e sem conteúdo privado atrás.
- Vazio: explique a condição e ofereça uma ação.
- Erro autenticável: voltar ao login.
- Erro transitório: Nova tentativa.
- Offline: informar que dados privados exigem rede.

## Responsividade

- Desktop: grade conforme conteúdo, sem esticar acima de 1680px.
- Notebook: priorizar área operacional; cards quebram antes de reduzir texto.
- Mobile: uma coluna, navegação rolável, drawers com altura dinâmica.
- Kanban: não comprimir colunas; usar rolagem horizontal com snap.
- Zoom: não fixar altura de texto, não deformar SVG, preservar foco e ações.

## Acessibilidade mínima

- foco visível em todos os controles;
- navegação sem hover obrigatório;
- texto alternativo para imagens informativas;
- rótulos acessíveis em botões sem texto;
- sem animação essencial e suporte a `prefers-reduced-motion`;
- erro anunciado em texto, não apenas por cor.

## Governança

Mudança relevante exige revisão do Manual, Relatórios Executivos e matriz de testes. Novos componentes devem reutilizar tokens e primitives existentes; estilos locais que recriam Button, Input, card ou modal precisam de justificativa. A meta de longo prazo é reduzir CSS corretivo global à medida que os módulos legados migram para os componentes canônicos.
