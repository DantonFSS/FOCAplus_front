export const STUDY_TYPE_MULTIPLIERS: { [key: string]: number } = {
  'Estudar para Avaliação': 2.0,
  'Fazer Tarefa de casa': 1.5,
  'Assistir Aula': 1.0,
  'Estudar Conteúdo': 1.0,
};

export const calculateXP = (timeInSeconds: number, studyType: string): number => {
  const minutes = Math.floor(timeInSeconds / 60);
  const baseXP = minutes;
  const multiplier = STUDY_TYPE_MULTIPLIERS[studyType] || 1.0;
  return Math.max(1, Math.round(baseXP * multiplier));
};

