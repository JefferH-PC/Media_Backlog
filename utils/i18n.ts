import { Locale, MediaType } from '@/types/backlog';

export const translations = {
  en: {
    appTitle: 'Backlog',
    appSubtitle: 'Personal media archive',
    importJson: 'Import JSON',
    exportJson: 'Export JSON',
    addItem: 'New Item',
    currentlyConsuming: 'In Progress',
    currentlyConsumingSub: 'Active focus for games, series & books',
    slotLabels: {
      games: 'Game',
      series: 'Series',
      books: 'Book',
      movies: 'Movie',
    },
    markConsumedAction: {
      games: 'Mark Completed',
      movies: 'Mark Watched',
      series: 'Mark Watched',
      books: 'Mark Read',
    },
    moveToBacklogAction: 'Move to Backlog',
    removeFromActive: 'Pause',
    consumeNow: {
      games: 'Play Now',
      series: 'Watch Now',
      books: 'Read Now',
    },
    activeBadge: 'In Progress',
    emptySlot: (medium: string) =>
      `No ${medium.toLowerCase()} in progress. Pick one from your shelf below.`,
    categoryLabels: {
      backlog: {
        games: 'Games',
        movies: 'Movies',
        series: 'Series',
        books: 'Books',
      },
      consumed: {
        games: 'Completed',
        movies: 'Watched',
        series: 'Watched',
        books: 'Read',
      },
    },
    statusFilterLabel: {
      backlog: 'Backlog',
      consumed: 'Completed',
    },
    toggleStatusBtn: {
      toConsumed: 'Switch to Completed',
      toBacklog: 'Switch to Backlog',
    },
    backlogTab: 'Backlog',
    consumedTab: 'Completed',
    searchPlaceholder: (categoryLabel: string) =>
      `Search in ${categoryLabel}...`,
    emptyCategoryTitle: 'Shelf is empty',
    emptyCategorySub:
      'Add a new title, restore from JSON backup, or load demo media.',
    loadDemoData: 'Load Sample Media',
    clearSearch: 'Clear search',
    edit: 'Edit',
    delete: 'Delete',
    seasonsUnit: (count: number) =>
      count === 1 ? '1 Season' : `${count} Seasons`,
    achievementsUnit: (count: number) =>
      count === 1 ? '1 Achievement' : `${count} Achievements`,
    modal: {
      addTitle: 'Add to Library',
      editTitle: 'Edit Item',
      mediaType: 'Category',
      status: 'Status',
      statusBacklog: 'Backlog (To consume)',
      statusConsumed: 'Completed',
      setCurrentlyConsuming: 'Set as In Progress',
      title: 'Title',
      titlePlaceholder: 'e.g. Elden Ring, Severance, Dune...',
      year: 'Release Year',
      yearSeries: 'Years Aired',
      yearPlaceholder: 'e.g. 2023',
      yearSeriesPlaceholder: 'e.g. 2022-2025',
      developer: 'Developer / Studio',
      developerPlaceholder: 'e.g. FromSoftware',
      achievements: 'Achievements',
      priceBRL: 'Price (R$)',
      duration: 'Duration',
      durationPlaceholder: 'e.g. 2h 28m',
      seasons: 'Seasons',
      author: 'Author',
      authorPlaceholder: 'e.g. Frank Herbert',
      publisher: 'Publisher',
      publisherPlaceholder: 'e.g. Penguin, Aleph',
      coverSection: 'Cover Artwork (2:3)',
      uploadFile: 'Upload Image',
      chooseFile: 'Choose image file',
      pasteUrl: 'Or enter direct image URL',
      urlPlaceholder: 'https://...',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      createItem: 'Add to Library',
    },
    confirmDelete: {
      title: 'Delete Item',
      message: (itemTitle: string) =>
        `Are you sure you want to remove "${itemTitle}" from your library?`,
      cancel: 'Cancel',
      confirm: 'Delete',
    },
    confirmReplace: {
      title: 'Replace Active Title',
      message: (currentTitle: string, newTitle: string) =>
        `"${currentTitle}" is currently in progress. Would you like to switch focus to "${newTitle}"?`,
      cancel: 'Keep Current',
      confirm: 'Switch Focus',
    },
    importModal: {
      title: 'Import Backup',
      description:
        'A valid backup file was loaded. How would you like to apply these items to your shelf?',
      overwriteTitle: 'Replace Library',
      overwriteDesc: 'Replaces your current library with the backup contents.',
      mergeTitle: 'Merge Library',
      mergeDesc: 'Adds any new titles without modifying your existing items.',
      cancel: 'Cancel',
    },
    notifications: {
      exported: 'Library backup exported successfully.',
      importedOverwrite: 'Library restored from backup.',
      importedMerge: (added: number) =>
        `Library updated (${added} new items added).`,
      invalidJson:
        'Invalid backup file. Required keys: games, movies, series, books.',
      demoLoaded: 'Sample library loaded.',
    },
    lastBackup: 'Last backup:',
  },
  'pt-BR': {
    appTitle: 'Backlog',
    appSubtitle: 'Acervo pessoal de mídia',
    importJson: 'Importar JSON',
    exportJson: 'Exportar JSON',
    addItem: 'Novo Item',
    currentlyConsuming: 'Em Andamento',
    currentlyConsumingSub: 'Foco ativo para jogos, séries e livros',
    slotLabels: {
      games: 'Jogo',
      series: 'Série',
      books: 'Livro',
      movies: 'Filme',
    },
    markConsumedAction: {
      games: 'Marcar Concluído',
      movies: 'Marcar Assistido',
      series: 'Marcar Assistido',
      books: 'Marcar Lido',
    },
    moveToBacklogAction: 'Mover para Backlog',
    removeFromActive: 'Pausar',
    consumeNow: {
      games: 'Jogar Agora',
      series: 'Assistir Agora',
      books: 'Ler Agora',
    },
    activeBadge: 'Em Andamento',
    emptySlot: (medium: string) =>
      `Nenhum ${medium.toLowerCase()} em andamento. Selecione um item da sua estante.`,
    categoryLabels: {
      backlog: {
        games: 'Jogos',
        movies: 'Filmes',
        series: 'Séries',
        books: 'Livros',
      },
      consumed: {
        games: 'Concluídos',
        movies: 'Assistidos',
        series: 'Assistidos',
        books: 'Lidos',
      },
    },
    statusFilterLabel: {
      backlog: 'Backlog',
      consumed: 'Concluídos',
    },
    toggleStatusBtn: {
      toConsumed: 'Mudar para Concluídos',
      toBacklog: 'Mudar para Backlog',
    },
    backlogTab: 'Backlog',
    consumedTab: 'Concluídos',
    searchPlaceholder: (categoryLabel: string) =>
      `Buscar em ${categoryLabel}...`,
    emptyCategoryTitle: 'Estante vazia',
    emptyCategorySub:
      'Adicione um novo título, restaure um backup ou carregue itens de demonstração.',
    loadDemoData: 'Carregar Itens de Exemplo',
    clearSearch: 'Limpar busca',
    edit: 'Editar',
    delete: 'Excluir',
    seasonsUnit: (count: number) =>
      count === 1 ? '1 Temporada' : `${count} Temporadas`,
    achievementsUnit: (count: number) =>
      count === 1 ? '1 Conquista' : `${count} Conquistas`,
    modal: {
      addTitle: 'Adicionar à Estante',
      editTitle: 'Editar Item',
      mediaType: 'Categoria',
      status: 'Status',
      statusBacklog: 'Backlog (A consumir)',
      statusConsumed: 'Concluído',
      setCurrentlyConsuming: 'Marcar como Em Andamento',
      title: 'Título',
      titlePlaceholder: 'ex: Elden Ring, Severance, Duna...',
      year: 'Ano de Lançamento',
      yearSeries: 'Anos de Exibição',
      yearPlaceholder: 'ex: 2023',
      yearSeriesPlaceholder: 'ex: 2022-2025',
      developer: 'Desenvolvedora / Estúdio',
      developerPlaceholder: 'ex: FromSoftware',
      achievements: 'Conquistas',
      priceBRL: 'Preço (R$)',
      duration: 'Duração',
      durationPlaceholder: 'ex: 2h 28m',
      seasons: 'Temporadas',
      author: 'Autor(a)',
      authorPlaceholder: 'ex: Frank Herbert',
      publisher: 'Editora',
      publisherPlaceholder: 'ex: Aleph, Companhia das Letras',
      coverSection: 'Capa / Pôster (2:3)',
      uploadFile: 'Enviar Imagem',
      chooseFile: 'Escolher arquivo',
      pasteUrl: 'Ou cole a URL direta da imagem',
      urlPlaceholder: 'https://...',
      cancel: 'Cancelar',
      saveChanges: 'Salvar Alterações',
      createItem: 'Adicionar à Estante',
    },
    confirmDelete: {
      title: 'Excluir Item',
      message: (itemTitle: string) =>
        `Tem certeza que deseja remover "${itemTitle}" da sua estante?`,
      cancel: 'Cancelar',
      confirm: 'Excluir',
    },
    confirmReplace: {
      title: 'Substituir Título Ativo',
      message: (currentTitle: string, newTitle: string) =>
        `"${currentTitle}" está em andamento. Deseja alternar o foco para "${newTitle}"?`,
      cancel: 'Manter Atual',
      confirm: 'Alternar Foco',
    },
    importModal: {
      title: 'Importar Backup',
      description:
        'Arquivo de backup identificado. Como deseja aplicar esses itens?',
      overwriteTitle: 'Substituir Estante',
      overwriteDesc: 'Substitui todos os dados atuais pelo conteúdo do backup.',
      mergeTitle: 'Mesclar Estante',
      mergeDesc: 'Adiciona novos itens sem alterar os já existentes.',
      cancel: 'Cancelar',
    },
    notifications: {
      exported: 'Backup da estante exportado com sucesso.',
      importedOverwrite: 'Estante restaurada a partir do backup.',
      importedMerge: (added: number) =>
        `Estante atualizada (${added} novos itens adicionados).`,
      invalidJson:
        'Arquivo inválido. Deve conter: games, movies, series, books.',
      demoLoaded: 'Itens de demonstração carregados.',
    },
    lastBackup: 'Último backup:',
  },
} as const;

export const getCategoryDisplayName = (
  locale: Locale,
  type: MediaType,
  status: 'backlog' | 'consumed'
): string => {
  return translations[locale].categoryLabels[status][type];
};
