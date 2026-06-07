# Gestão de Luminárias Públicas

Protótipo mobile em Expo + React Native + TypeScript para cadastro, consulta e manutenção de postes, braços, luminárias e ordens de serviço em campo.

O app possui login mockado offline, abre no Dashboard após autenticação e persiste dados localmente com AsyncStorage.

## Funcionalidades

- Dashboard com total de postes, luminárias LED, luminárias com problema e ordens abertas.
- Inventario gerencial com distribuicao por bairro, tecnologia, fornecedor, licitacao, garantia e ativos criticos.
- Relatorios CSV locais de postes, ordens de servico e denuncias pela tela de inventario.
- Lista de postes com busca e filtros por bairro, status, tipo de luminária e problema.
- Detalhes do poste com localização, luminária, braço, histórico, foto e ordens vinculadas.
- Cadastro e edição de poste com GPS via `expo-location`.
- Registro de manutencao em formulario proprio, atualizando historico, status do poste, luminaria e braco.
- Anexo de foto via `expo-image-picker`.
- Mapa com pins coloridos usando `react-native-maps`.
- Fallback de mapa para web, mantendo consulta dos ativos no navegador.
- Criação e atualização de ordens de serviço.
- Conclusao de OS registra automaticamente manutencao no historico do poste vinculado.
- Manutencoes manuais podem atualizar o estado final do poste, luminaria e braco.
- Ordens guardam ultima atualizacao, responsavel, data de conclusao e responsavel pela conclusao.
- Perfil de acesso mockado para `admin`, `funcionario` e `cidadao`.
- Tela administrativa de usuarios e matriz de permissoes para validar a divisao de acesso.
- Registro e acompanhamento de denúncias de falhas na iluminação.
- Conversao de denuncia vinculada a poste em ordem de servico, mantendo origem e solicitante na OS.
- Senhas de demonstracao verificadas por hash SHA-256 local com salt e custo por iteracoes via `expo-crypto`.
- Trilha de auditoria local para alterações em postes, ordens, denúncias e manutenções.
- Fila de sincronização offline para preparar envio futuro ao backend.
- Backup JSON local completo, com exportacao e restauracao restritas a admin, contendo ativos, ordens, denuncias, auditoria e fila de sync.

## Stack

- Expo
- React Native
- TypeScript
- React Navigation
- AsyncStorage
- Expo Location
- Expo Image Picker
- React Native Maps
- Expo Crypto

## Perfis de acesso do prototipo

- `admin`: controle total previsto para gestao do sistema.
- `funcionario`: pode cadastrar, editar e atualizar ativos e ordens.
- `cidadao`: pode consultar ativos e registrar denuncias.

## Contas de teste

```text
admin@prefeitura.local / admin123
funcionario@prefeitura.local / funcionario123
cidadao@app.local / cidadao123
```

## Segurança

- Este prototipo usa hash local com salt e iteracoes para nao manter senhas de exemplo em texto puro.
- O login mockado aplica bloqueio temporario local apos tentativas invalidas repetidas, simulando rate limit.
- As regras de acesso tambem sao validadas no contexto de dados, nao apenas por botoes desabilitados na interface.
- Telas restritas de cadastro, OS, auditoria e usuarios usam guarda explicita por perfil.
- As regras de integridade de dominio ficam centralizadas antes da persistencia local: codigos duplicados, patrimonio duplicado, coordenadas, datas, potencia, garantia e vinculos sao recusados.
- `admin` pode executar acoes de controle do sistema, como simular sincronizacao.
- `admin` e `funcionario` podem cadastrar e atualizar ativos, ordens, denuncias e manutencoes.
- `cidadao` pode consultar ativos e registrar/acompanhar denuncias proprias.
- Em producao, autenticacao deve ficar no backend com TLS, tokens de sessao curtos, refresh token protegido, rate limit, auditoria e senhas com Argon2id ou bcrypt.
- O app mobile deve manter operacao offline com fila de sincronizacao e resolver conflitos quando o backend estiver disponivel.

## Auditoria e sincronizacao offline

- Cada criacao ou atualizacao relevante gera um evento em `auditLogs`.
- Cada mudanca local gera um item `pending` em `syncQueue`, com snapshot do payload, usuario responsavel e chave de idempotencia.
- A tela `Auditoria e sincronizacao` permite acompanhar pendencias e simular envio em lote ao backend.
- Itens com falha de sincronizacao podem ser reprocessados localmente por admin sem perder tentativas anteriores.
- Admin pode compartilhar e restaurar um backup JSON versionado do estado local para preservacao operacional antes do backend real.
- Na fase de backend, essa fila deve virar um mecanismo real de envio, retry, deduplicacao por idempotency key e resolucao de conflitos.
- O contrato REST futuro esta em `docs/backend-contract.md`.

## Como rodar

Instale as dependências:

```bash
npm install
```

Inicie o app:

```bash
npm start
```

Ou, se o `npm` do ambiente estiver apontando para um caminho quebrado, use:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install --cache .npm-cache
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" start
```

Depois, abra no Expo Go ou no navegador local conforme indicado pelo Expo.

## Demo do prototipo

Fluxo sugerido para apresentar o prototipo:

1. Entrar como `funcionario@prefeitura.local`.
2. Abrir o Dashboard e conferir os indicadores de postes, LED, problemas e OS abertas.
3. Ir para `Postes`, buscar por bairro/codigo e abrir um detalhe.
4. Registrar uma manutencao no poste e confirmar o historico atualizado.
5. Criar uma ordem de servico vinculada ao poste e alterar o status ate conclusao.
6. Abrir o mapa e validar os pins por estado do ativo.
7. Entrar como `cidadao@app.local` e registrar uma denuncia.
8. Entrar como `admin@prefeitura.local` para revisar auditoria, sincronizacao e backup.

## Publicacao web

O app pode ser exportado para web com:

```bash
npm run export:web
```

O projeto esta configurado para GitHub Pages no caminho `/projeto-apolo`. A URL esperada apos o workflow de deploy concluir e:

```text
https://muriloelc.github.io/projeto-apolo/
```

## Verificacao

Rode a verificacao completa:

```bash
npm run check
```

Alternativa se o `npm` global falhar:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run typecheck
.\node_modules\.bin\expo.cmd export --platform web
```

Checklist manual antes da apresentacao:

- O login funciona nos perfis `admin`, `funcionario` e `cidadao`.
- Os dados continuam salvos apos recarregar o app.
- O perfil `cidadao` nao acessa telas restritas de gestao.
- O perfil `funcionario` cadastra poste, registra manutencao e atualiza OS.
- O perfil `admin` acessa auditoria, sincronizacao, backup e usuarios.
- A versao web abre pela publicacao e a versao mobile abre no Expo Go.

## Estrutura

```text
src/
  components/
  data/
  navigation/
  screens/
  storage/
  types/
  utils/
```

## Observacoes

- Nao ha backend, autenticacao real ou banco de dados nesta versao.
- Fotos ficam como URIs locais retornadas pelo Image Picker.
- Se o GPS nao tiver permissao, o cadastro usa coordenadas mockadas para manter o prototipo funcional.
- Os dados persistidos localmente podem ser limpos removendo o armazenamento do app no dispositivo/emulador.
