# Rascunho — não publicado

Apresento o Stockroom, um projeto Full Stack de controle de estoque para pequenas operações.

A aplicação organiza produtos, fornecedores, entradas e saídas, com indicadores de reposição e um histórico de cada movimentação.

O foco técnico está na integridade dos saldos: operações concorrentes são serializadas com locks de linha, saídas não podem deixar o estoque negativo e repetir uma requisição com a mesma chave não movimenta as unidades novamente. Saldo e histórico são gravados na mesma transação.

Stack: Ruby on Rails, PostgreSQL, React e TypeScript. O repositório inclui testes em RSpec e Playwright, documentação OpenAPI e configuração de CI.

O projeto usa dados fictícios e não possui conexão com ERP, execução de compras ou pagamentos.

GitHub: https://github.com/SamirGedeon/stockroom

#RubyOnRails #React #TypeScript #PostgreSQL #FullStack #Portfolio #DevJunior

Revisar antes de publicar. Nenhum conteúdo foi enviado ao LinkedIn.
