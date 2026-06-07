export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  PostesList: undefined;
  PosteDetails: { posteId: string };
  PosteForm: { posteId?: string } | undefined;
  ManutencaoForm: { posteId: string };
  Map: { posteId?: string } | undefined;
  Ordens: undefined;
  OrdemForm: { posteId?: string; denunciaId?: string } | undefined;
  Denuncias: undefined;
  DenunciaForm: { posteId?: string } | undefined;
  Auditoria: undefined;
  Inventario: undefined;
  Usuarios: undefined;
};
