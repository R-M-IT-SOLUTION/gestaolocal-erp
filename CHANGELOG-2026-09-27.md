# GestãoLocal ERP — Atualização 27/09/2026

## Navegação e acessibilidade
- Menu lateral redesenhado para evitar sobreposição entre ícones, títulos e rótulos.
- Incluído modo **fixo (pinado)** e modo **flutuante**, com preferência salva no navegador.
- Navegação lateral com largura, espaçamento e estados ativos mais consistentes.
- Rótulos longos passam a usar truncamento sem colidir com os ícones.
- Foco de teclado e descrições ARIA preservados.

## Cabeçalho
- Tema claro/escuro movido para o canto superior direito.
- Perfil do usuário passou a ficar visível no cabeçalho.
- Botão **Sair** disponível para todos os perfis autenticados.
- Logout solicita confirmação antes de encerrar a sessão.

## Login
- Layout revisado para desktop e telas pequenas.
- Cabeçalho do acesso reorganizado e compatível com o seletor de tema.
- Campos, botões e cartões receberam dimensões e estados de foco mais consistentes.

## Interface ERP
- Ajustes visuais para uma linguagem mais atual de sistemas administrativos: superfícies discretas, cantos suaves, estados ativos claros e ícones lineares.
- Tema e navegação agora permanecem acessíveis sem ocupar espaço desnecessário no rodapé lateral.

## Validação
- O código foi revisado após as alterações.
- O ambiente desta entrega não possui as dependências npm instaladas; a instalação automática não pôde ser concluída por indisponibilidade do pacote no cache/ambiente. Portanto, não foi declarado um build de produção como validado.


## Refinamento de dashboard, navegação e login — revisão 2
- Restaurado e ampliado o painel com indicadores financeiros, operacionais, estoque e alertas.
- Reduzidos tamanhos de ícones e espaçamentos da navegação lateral para eliminar excesso visual.
- Ajustado o menu fixo/flutuante para manter largura e rótulos consistentes.
- Reequilibrado o login: cartões de perfil, campos de usuário/senha, botão de visualização da senha e ações responsivas.
- Melhorado o comportamento em telas estreitas e prevenção de sobreposição de textos.
