# Contrato REST futuro

Este prototipo ainda funciona offline e sem backend real. Este documento define o contrato esperado para a API futura, para que o app web/mobile possa sincronizar sem mudar o dominio principal.

## Autenticacao

```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

- Senhas devem ser armazenadas no backend com Argon2id ou bcrypt.
- Toda comunicacao deve usar TLS.
- A API deve emitir access token curto e refresh token protegido.
- Respostas devem incluir o perfil: `admin`, `funcionario` ou `cidadao`.

## Sincronizacao offline

```http
POST /sync/batch
Idempotency-Key: <batch-id>
Authorization: Bearer <token>
```

Request:

```json
{
  "deviceId": "local-device-demo",
  "generatedAt": "2026-06-06T12:00:00.000Z",
  "operations": [
    {
      "id": "sync-1",
      "idempotencyKey": "poste:poste-1:update:2026-06-06T12:00:00.000Z",
      "entity": "poste",
      "operation": "update",
      "entityId": "poste-1",
      "actorId": "usr-admin",
      "actorRole": "admin",
      "payload": {},
      "createdAt": "2026-06-06T12:00:00.000Z"
    }
  ]
}
```

Response:

```json
{
  "acceptedAt": "2026-06-06T12:00:01.000Z",
  "results": [
    {
      "id": "sync-1",
      "status": "synced",
      "remoteVersion": 7
    }
  ]
}
```

Regras:

- `idempotencyKey` deve impedir duplicidade em reenvios.
- Operacoes devem ser aplicadas por entidade e permissao do usuario.
- Falhas parciais devem retornar `status: "failed"` por operacao.
- O app permite reprocessar operacoes `failed`, preservando a chave de idempotencia original.
- Conflitos devem retornar erro especifico, versao remota e payload atual do servidor.

## Ativos

```http
GET /postes
GET /postes/:id
POST /postes
PUT /postes/:id
```

Campos obrigatorios:

- codigo
- patrimonioId
- latitude/longitude
- enderecoReferencia
- bairro
- status
- tipoPoste
- alturaMetros
- circuito
- transformadorReferencia
- luminaria com marca, modelo, especificacao, produtoId, numeroLicitacao, dataCompra, dataInstalacao, fornecedor e garantiaMeses
- braco

## Ordens de servico

```http
GET /ordens
POST /ordens
PATCH /ordens/:id/status
```

Regra operacional:

- Quando uma OS muda para `concluida`, o ativo vinculado deve receber registro de manutencao com referencia a OS.

Campos de rastreabilidade:

- `origem`: `manual` ou `denuncia`
- `denunciaId`, `denunciaCodigo` e `solicitante` quando a OS nascer de uma denuncia cidadã
- `dataAtualizacao`, `atualizadaPor`, `dataConclusao` e `concluidaPor` para rastrear responsaveis por status
- o poste da OS deve ser o mesmo poste informado na denuncia, quando existir vínculo

## Manutencoes

```http
POST /postes/:id/manutencoes
```

- Registra descricao, data e responsavel da manutencao.
- Pode atualizar status do poste, estado da luminaria e estado do braco no mesmo evento.
- Deve gerar auditoria e operacao de sincronizacao offline.

## Denuncias

```http
GET /denuncias
POST /denuncias
PATCH /denuncias/:id/status
```

- `cidadao` cria e acompanha denuncias proprias.
- `admin` e `funcionario` acompanham e atualizam status.
- `admin` e `funcionario` podem converter denuncia vinculada a poste em ordem de servico.

## Auditoria

```http
GET /audit-logs
```

Cada mutacao deve registrar:

- ator
- perfil
- entidade
- acao
- timestamp
- resumo
- versao antes/depois quando aplicavel

## Relatorios

```http
GET /reports/postes.csv
GET /reports/ordens.csv
GET /reports/denuncias.csv
```

- O app ja gera CSV localmente para operacao offline.
- No backend, estes endpoints devem aplicar os mesmos filtros de perfil e escopo usados na API principal.

## Backup administrativo

```http
GET /admin/backups/local-export.json
```

- No prototipo, o admin consegue compartilhar um JSON local versionado com todo o estado do dispositivo.
- No prototipo, o admin tambem consegue restaurar esse JSON local no dispositivo.
- Em producao, backup/exportacao/restauracao completa deve ser restrita a admin, auditada e protegida por autenticacao forte.
