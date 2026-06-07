import { UsuarioComCredenciais } from "../types/Usuario";

export const mockUsers: UsuarioComCredenciais[] = [
  {
    id: "usr-admin",
    nome: "Admin Municipal",
    email: "admin@prefeitura.local",
    perfil: "admin",
    passwordSalt: "luz-admin-v2",
    passwordHash: "b640c42cbe4ec568aa7417a89d77f97a5dcbf8df4995d53946cec30f53cc20d1",
    passwordIterations: 250,
  },
  {
    id: "usr-funcionario",
    nome: "Equipe de Campo",
    email: "funcionario@prefeitura.local",
    perfil: "funcionario",
    passwordSalt: "luz-func-v2",
    passwordHash: "a9ba8591adfbdd5b50cb0c51f6d53bdd658170cf43991a62039a45b1f062ad88",
    passwordIterations: 250,
  },
  {
    id: "usr-cidadao",
    nome: "Cidadão",
    email: "cidadao@app.local",
    perfil: "cidadao",
    passwordSalt: "luz-cid-v2",
    passwordHash: "efaf982a26abcf4df8fe94f86b8e7554d374e3be335f52a86874e1cf0d1f8b43",
    passwordIterations: 250,
  },
];
