# Spotify History OAuth Relay

Relay HTTPS estático do projeto Spotify History para o retorno OAuth do Spotify a uma instalação Umbrel acessada na mesma rede local.

## Segurança

Este repositório é público por design e não deve conter segredos.

Não são armazenados aqui:

- Client Secret;
- access token;
- refresh token;
- code verifier PKCE;
- banco de histórico;
- credenciais do Umbrel.

O callback apenas recebe `code + state` no navegador, valida que o destino codificado no `state` pertence a uma origem local permitida e redireciona o próprio navegador para `/auth/callback` na instalação Umbrel.

## Endpoint

Após habilitar GitHub Pages:

```text
https://marcus300.github.io/spotify-history-oauth-relay/callback/
```

A configuração e reautorização devem ser executadas em um navegador conectado à mesma rede local do Umbrel.


## Hardening do relay

O callback valida localmente o destino codificado no `state` antes de qualquer redirecionamento.

Regras aplicadas:

- aceita apenas `http` ou `https`;
- aceita apenas hostnames `.local`, IPv4 privados/loopback/link-local e IPv6 locais;
- rejeita destinos públicos;
- rejeita credenciais embutidas, paths arbitrários, query strings e fragments;
- rejeita versão de state incompatível e Base64URL inválido;
- rejeita parâmetros OAuth duplicados;
- encaminha somente `code`, `state`, `error` e `error_description`;
- remove a query da URL pública antes de exibir erro ou redirecionar;
- mantém `referrer=no-referrer`;
- não faz `fetch`, XHR ou qualquer chamada direta ao Umbrel.

O workflow do GitHub Pages executa a bateria `node --test tests/relay.test.js` antes da publicação.
