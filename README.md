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
