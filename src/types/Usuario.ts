export type PerfilAcesso = "admin" | "funcionario" | "cidadao";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilAcesso;
};

export type UsuarioComCredenciais = Usuario & {
  passwordSalt: string;
  passwordHash: string;
  passwordIterations: number;
};

export function canManageAssets(perfil: PerfilAcesso) {
  return perfil === "admin" || perfil === "funcionario";
}

export function canControlSystem(perfil: PerfilAcesso) {
  return perfil === "admin";
}
