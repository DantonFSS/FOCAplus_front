// Utility functions will go here

// Tipos de estudo e seus multiplicadores de XP
export const STUDY_TYPE_MULTIPLIERS: { [key: string]: number } = {
  'Estudar para Avaliação': 2.0, // Maior valor
  'Fazer Tarefa de casa': 1.5,
  'Assistir Aula': 1.0,
  'Estudar Conteúdo': 1.0,
};

// Calcular XP baseado no tempo estudado e tipo de estudo
export const calculateXP = (timeInSeconds: number, studyType: string): number => {
  // Base: 1 XP por minuto de estudo
  const minutes = Math.floor(timeInSeconds / 60);
  const baseXP = minutes;
  
  // Aplicar multiplicador baseado no tipo de estudo
  const multiplier = STUDY_TYPE_MULTIPLIERS[studyType] || 1.0;
  
  // Arredondar para cima para garantir que sempre ganhe pelo menos 1 XP
  return Math.max(1, Math.round(baseXP * multiplier));
};

