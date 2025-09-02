// ルール管理ユーティリティの統合エクスポート

// パズル型ルールビルダーユーティリティ
export {
  convertLegacyToBlocks,
  convertBlocksToLegacy,
  generateNaturalLanguage,
  generateConditionId,
} from './puzzleDataConverter';

// バリデーションユーティリティ
export {
  validateConditionBlock,
  validateConditionBlocks,
  VALIDATION_RULES,
  createDebouncedValidator,
  mergeValidationResults,
} from './puzzleValidation';