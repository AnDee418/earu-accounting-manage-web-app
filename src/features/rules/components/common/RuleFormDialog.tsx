'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Autocomplete,
  Divider,
} from '@mui/material';

import { 
  AccountAssignmentRule, 
  TaxAssignmentRule, 
  DepartmentCashMapping,
  DataFormatSettings,
  ConditionBlock 
} from '@/types/rules';
import RuleConditionBuilder from './RuleConditionBuilder';
import { PuzzleRuleBuilder } from '@/features/rules/components/puzzle';

type RuleType = 'account-assignment' | 'tax-assignment' | 'department-mapping' | 'data-format';
type Rule = AccountAssignmentRule | TaxAssignmentRule | DepartmentCashMapping | DataFormatSettings;

interface RuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  rule?: any | null;
  ruleType: RuleType;
  title: string;
  /** パズル型UIを使用するかどうか */
  usePuzzleUI?: boolean;
}

export default function RuleFormDialog({
  open,
  onClose,
  onSave,
  rule,
  ruleType,
  title,
  usePuzzleUI = true, // デフォルトでパズル型UIを使用
}: RuleFormDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [puzzleConditions, setPuzzleConditions] = useState<ConditionBlock[]>([]);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
      // パズル条件の初期化
      if (rule.conditions?.conditionBlocks) {
        setPuzzleConditions(rule.conditions.conditionBlocks);
      } else {
        setPuzzleConditions([]);
      }
    } else {
      // Initialize with default values based on rule type
      switch (ruleType) {
        case 'account-assignment':
          setFormData({
            name: '',
            description: '',
            conditions: {
              conditionBlocks: [],
              // 従来の条件（後方互換性）
              expenseTypePatterns: [],
              merchantPatterns: [],
              keywords: [],
              receiptContentPatterns: [],
            },
            assignment: {
              debitAccountCode: '',
              creditAccountCode: '111', // Default to cash (PCA code)
            },
            priority: 10,
            isActive: true,
          });
          setPuzzleConditions([]);
          break;
        case 'tax-assignment':
          setFormData({
            name: '',
            description: '',
            conditions: {
              taxRate: 0.10,
              invoiceCompliant: true,
              accountCodes: [],
            },
            assignment: {
              debitTaxCode: 'Q5',
              creditTaxCode: '00',
            },
            priority: 10,
            isActive: true,
          });
          break;
        case 'department-mapping':
          setFormData({
            departmentCode: '',
            departmentName: '',
            cashAuxiliaryCode: '',
            cashAuxiliaryName: '',
            isActive: true,
          });
          break;
      }
    }
    setErrors({});
  }, [rule, ruleType, open]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleNestedFieldChange = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value,
      },
    }));
  };

  const handlePuzzleConditionsChange = useCallback((conditions: ConditionBlock[]) => {
    setPuzzleConditions(conditions);
    // パズル条件をformDataに反映
    setFormData((prev: any) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        conditionBlocks: conditions,
      },
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (ruleType) {
      case 'account-assignment':
        if (!(formData as AccountAssignmentRule).name) {
          newErrors.name = 'ルール名は必須です';
        }
        if (!(formData as AccountAssignmentRule).assignment?.debitAccountCode) {
          newErrors.debitAccountCode = '借方勘定科目は必須です';
        }
        if (!(formData as AccountAssignmentRule).assignment?.creditAccountCode) {
          newErrors.creditAccountCode = '貸方勘定科目は必須です';
        }
        break;
      case 'tax-assignment':
        if (!(formData as TaxAssignmentRule).name) {
          newErrors.name = 'ルール名は必須です';
        }
        if (!(formData as TaxAssignmentRule).conditions?.accountCodes?.length) {
          newErrors.accountCodes = '対象勘定科目コードは必須です';
        }
        if (!(formData as TaxAssignmentRule).assignment?.debitTaxCode) {
          newErrors.debitTaxCode = '借方税区分は必須です';
        }
        if (!(formData as TaxAssignmentRule).assignment?.creditTaxCode) {
          newErrors.creditTaxCode = '貸方税区分は必須です';
        }
        break;
      case 'department-mapping':
        if (!(formData as DepartmentCashMapping).departmentCode) {
          newErrors.departmentCode = '部門コードは必須です';
        }
        if (!(formData as DepartmentCashMapping).departmentName) {
          newErrors.departmentName = '部門名は必須です';
        }
        if (!(formData as DepartmentCashMapping).cashAuxiliaryCode) {
          newErrors.cashAuxiliaryCode = '現金補助科目コードは必須です';
        }
        if (!(formData as DepartmentCashMapping).cashAuxiliaryName) {
          newErrors.cashAuxiliaryName = '現金補助科目名は必須です';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const renderAccountAssignmentForm = () => {
    const data = formData as Partial<AccountAssignmentRule>;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="ルール名"
          value={data.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
        <TextField
          fullWidth
          label="説明"
          value={data.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          multiline
          rows={2}
        />
        
        <Divider sx={{ my: 1 }}>
          <Typography variant="caption">適用条件</Typography>
        </Divider>
        
        {usePuzzleUI && ruleType === 'account-assignment' ? (
          // パズル型UI
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
            <PuzzleRuleBuilder
              key={`puzzle-${open}`} // ダイアログが開くたびに新しいインスタンスを作成
              initialConditions={puzzleConditions}
              onChange={handlePuzzleConditionsChange}
              readOnly={false}
              showHelp={false}
            />
          </Box>
        ) : (
          // 従来のフォーム（後方互換性）
          <>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[
                    '福利厚生', '健康保険', '厚生年金', '労災保険', '雇用保険',
                    '交通費', '旅費', '電車代', 'バス代', '運賃', '乗車券', '定期券',
                    '通信費', '電話代', 'インターネット', '携帯電話', 'プロバイダ',
                    '駐車場代', 'ガソリン代', '高速代', '車検代', '自動車保険',
                    '宅配便', '郵送料', '配送料', '運送費',
                    '接待費', '会食費', '贈答品', 'お中元', 'お歳暮',
                    '会議費', '研修費', 'セミナー', '講習会',
                    '消耗品', '事務用品', '文房具', '用紙', 'トナー',
                    '印紙税', '登録免許税', '固定資産税', '自動車税', '住民税',
                    '事務用消耗品', 'コピー用紙', 'ファイル', 'ペン', 'ノート'
                  ]}
                  value={data.conditions?.expenseTypePatterns || []}
                  onChange={(_, value) => handleNestedFieldChange('conditions', 'expenseTypePatterns', value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="経費種別パターン"
                      placeholder="経費種別を入力（例：駐車場代、交通費）"
                      helperText="領収書の内容から自動判定される経費種別パターンを指定"
                    />
                  )}
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[
                    'JR.*', '.*地下鉄.*', '.*バス.*', '.*タクシー.*',
                    '.*駐車場.*', '.*パーキング.*', '.*SS.*', '.*石油.*',
                    '.*ENEOS.*', '.*出光.*', '.*テレコム.*', '.*通信.*',
                    '.*モバイル.*', '.*プロバイダ.*', '.*保険.*', '.*年金.*'
                  ]}
                  value={data.conditions?.merchantPatterns || []}
                  onChange={(_, value) => handleNestedFieldChange('conditions', 'merchantPatterns', value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="取引先パターン"
                      placeholder="取引先パターンを入力（正規表現可）"
                      helperText="取引先名のパターンマッチング（正規表現対応）"
                    />
                  )}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[
                    '電車', '運賃', '乗車券', '定期券', '回数券',
                    '駐車場', 'パーキング', 'ガソリン', '高速道路',
                    '保険料', '年金', '共済', '福利厚生',
                    '電話料金', 'インターネット', '通信費', '携帯',
                    '印紙', '税金', '登録', '固定資産', '自動車税',
                    '消耗品', '文房具', '事務用品', 'コピー用紙'
                  ]}
                  value={data.conditions?.keywords || []}
                  onChange={(_, value) => handleNestedFieldChange('conditions', 'keywords', value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="摘要キーワード"
                      placeholder="摘要に含まれるキーワードを入力"
                      helperText="領収書の摘要や説明文に含まれるキーワード"
                    />
                  )}
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={data.conditions?.receiptContentPatterns || []}
                  onChange={(_, value) => handleNestedFieldChange('conditions', 'receiptContentPatterns', value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="領収書内容パターン"
                      placeholder="領収書内容パターンを入力（正規表現可）"
                      helperText="領収書全体の内容に対するパターンマッチング"
                    />
                  )}
                />
              </Box>
            </Box>
          </>
        )}
        
        <Divider sx={{ my: 1 }}>
          <Typography variant="caption">勘定科目割り当て</Typography>
        </Divider>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth error={!!errors.debitAccountCode} required>
              <InputLabel>借方勘定科目コード</InputLabel>
              <Select
                value={data.assignment?.debitAccountCode || ''}
                onChange={(e) => handleNestedFieldChange('assignment', 'debitAccountCode', e.target.value)}
                label="借方勘定科目コード"
              >
                <MenuItem value="724">724 - 福利厚生費</MenuItem>
                <MenuItem value="726">726 - 旅費交通費</MenuItem>
                <MenuItem value="727">727 - 通信費</MenuItem>
                <MenuItem value="729">729 - 車両費</MenuItem>
                <MenuItem value="731">731 - 運賃</MenuItem>
                <MenuItem value="733">733 - 交際接待費</MenuItem>
                <MenuItem value="734">734 - 会議費</MenuItem>
                <MenuItem value="737">737 - 消耗品費</MenuItem>
                <MenuItem value="738">738 - 租税公課</MenuItem>
                <MenuItem value="754">754 - 事務用消耗品費</MenuItem>
              </Select>
              {errors.debitAccountCode && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.debitAccountCode}
                </Typography>
              )}
            </FormControl>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth error={!!errors.creditAccountCode} required>
              <InputLabel>貸方勘定科目コード</InputLabel>
              <Select
                value={data.assignment?.creditAccountCode || ''}
                onChange={(e) => handleNestedFieldChange('assignment', 'creditAccountCode', e.target.value)}
                label="貸方勘定科目コード"
              >
                <MenuItem value="111">111 - 現金</MenuItem>
              </Select>
              {errors.creditAccountCode && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.creditAccountCode}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel>借方補助科目コード</InputLabel>
              <Select
                value={data.assignment?.debitSubAccountCode || ''}
                onChange={(e) => handleNestedFieldChange('assignment', 'debitSubAccountCode', e.target.value)}
                label="借方補助科目コード"
              >
                <MenuItem value="">なし</MenuItem>
                {data.assignment?.debitAccountCode === '729' && (
                  <>
                    <MenuItem value="001">001 - 課税事業者（インボイス対応）</MenuItem>
                    <MenuItem value="002">002 - 免税事業者（インボイス非対応）</MenuItem>
                  </>
                )}
                {data.assignment?.debitAccountCode === '738' && (
                  <MenuItem value="001">001 - 通常</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel>貸方補助科目コード</InputLabel>
              <Select
                value={data.assignment?.creditSubAccountCode || ''}
                onChange={(e) => handleNestedFieldChange('assignment', 'creditSubAccountCode', e.target.value)}
                label="貸方補助科目コード"
              >
                <MenuItem value="">なし</MenuItem>
                <MenuItem value="001">001 - 札幌支店</MenuItem>
                <MenuItem value="002">002 - 仙台事業所</MenuItem>
                <MenuItem value="003">003 - 東京支店</MenuItem>
                <MenuItem value="004">004 - 福岡事業所</MenuItem>
                <MenuItem value="005">005 - 大阪事業所</MenuItem>
                <MenuItem value="006">006 - 名古屋事務所</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              type="number"
              label="優先度"
              value={data.priority || 10}
              onChange={(e) => handleFieldChange('priority', parseInt(e.target.value))}
              helperText="数値が小さいほど優先度が高くなります"
            />
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.isActive || false}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                />
              }
              label="ルールを有効にする"
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderTaxAssignmentForm = () => {
    const data = formData as Partial<TaxAssignmentRule>;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="ルール名"
          value={data.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
        <TextField
          fullWidth
          label="説明"
          value={data.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          multiline
          rows={2}
        />
        
        <Divider sx={{ my: 1 }}>
          <Typography variant="caption">判定条件</Typography>
        </Divider>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Autocomplete
              multiple
              options={[
                '724', '726', '727', '729', '731', '733', '734', '737', '738', '754'
              ]}
              getOptionLabel={(option) => {
                const accountNames: Record<string, string> = {
                  '724': '724 - 福利厚生費',
                  '726': '726 - 旅費交通費',
                  '727': '727 - 通信費',
                  '729': '729 - 車両費',
                  '731': '731 - 運賃',
                  '733': '733 - 交際接待費',
                  '734': '734 - 会議費',
                  '737': '737 - 消耗品費',
                  '738': '738 - 租税公課',
                  '754': '754 - 事務用消耗品費',
                };
                return accountNames[option] || option;
              }}
              value={data.conditions?.accountCodes || []}
              onChange={(_, value) => handleNestedFieldChange('conditions', 'accountCodes', value)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="対象勘定科目コード"
                  placeholder="勘定科目コードを選択"
                  helperText={errors.accountCodes || "この税区分ルールが適用される勘定科目コード（必須）"}
                  error={!!errors.accountCodes}
                  required
                />
              )}
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel>税率</InputLabel>
              <Select
                value={data.conditions?.taxRate || 0.10}
                onChange={(e) => handleNestedFieldChange('conditions', 'taxRate', e.target.value)}
                label="税率"
              >
                <MenuItem value={0.10}>10%</MenuItem>
                <MenuItem value={0.08}>8%</MenuItem>
                <MenuItem value={0}>0% (非課税)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel>インボイス対応</InputLabel>
              <Select
                value={data.conditions?.invoiceCompliant !== undefined ? data.conditions.invoiceCompliant : true}
                onChange={(e) => handleNestedFieldChange('conditions', 'invoiceCompliant', e.target.value)}
                label="インボイス対応"
              >
                <MenuItem value={true}>対応</MenuItem>
                <MenuItem value={false}>非対応</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <Divider sx={{ my: 1 }}>
          <Typography variant="caption">税区分割り当て</Typography>
        </Divider>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel>借方税区分</InputLabel>
              <Select
                value={data.assignment?.debitTaxCode || 'Q5'}
                onChange={(e) => handleNestedFieldChange('assignment', 'debitTaxCode', e.target.value)}
                label="借方税区分"
                error={!!errors.debitTaxCode}
              >
                <MenuItem value="Q5">Q5 - 仕入10%(インボイス)</MenuItem>
                <MenuItem value="Q6">Q6 - 仕入8%(インボイス)</MenuItem>
                <MenuItem value="QD">QD - 仕入10%(非インボイス)</MenuItem>
                <MenuItem value="QE">QE - 仕入8%(非インボイス)</MenuItem>
                <MenuItem value="P0">P0 - 対象外</MenuItem>
                <MenuItem value="00">00 - 非課税</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel>貸方税区分</InputLabel>
              <Select
                value={data.assignment?.creditTaxCode || '00'}
                onChange={(e) => handleNestedFieldChange('assignment', 'creditTaxCode', e.target.value)}
                label="貸方税区分"
                error={!!errors.creditTaxCode}
              >
                <MenuItem value="00">00 - 非課税</MenuItem>
                <MenuItem value="P0">P0 - 対象外</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              type="number"
              label="優先度"
              value={data.priority || 10}
              onChange={(e) => handleFieldChange('priority', parseInt(e.target.value))}
              helperText="数値が小さいほど優先度が高くなります"
            />
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.isActive || false}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                />
              }
              label="ルールを有効にする"
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderDepartmentMappingForm = () => {
    const data = formData as Partial<DepartmentCashMapping>;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              label="部門コード"
              value={data.departmentCode || ''}
              onChange={(e) => handleFieldChange('departmentCode', e.target.value)}
              error={!!errors.departmentCode}
              helperText={errors.departmentCode}
              required
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              label="部門名"
              value={data.departmentName || ''}
              onChange={(e) => handleFieldChange('departmentName', e.target.value)}
              error={!!errors.departmentName}
              helperText={errors.departmentName}
              required
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              label="現金補助科目コード"
              value={data.cashAuxiliaryCode || ''}
              onChange={(e) => handleFieldChange('cashAuxiliaryCode', e.target.value)}
              error={!!errors.cashAuxiliaryCode}
              helperText={errors.cashAuxiliaryCode}
              required
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              label="現金補助科目名"
              value={data.cashAuxiliaryName || ''}
              onChange={(e) => handleFieldChange('cashAuxiliaryName', e.target.value)}
              error={!!errors.cashAuxiliaryName}
              helperText={errors.cashAuxiliaryName}
              required
            />
          </Box>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={data.isActive || false}
              onChange={(e) => handleFieldChange('isActive', e.target.checked)}
            />
          }
          label="マッピングを有効にする"
        />
      </Box>
    );
  };

  const renderFormContent = () => {
    switch (ruleType) {
      case 'account-assignment':
        return renderAccountAssignmentForm();
      case 'tax-assignment':
        return renderTaxAssignmentForm();
      case 'department-mapping':
        return renderDepartmentMappingForm();
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={usePuzzleUI && ruleType === 'account-assignment' ? 'lg' : 'md'} 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: usePuzzleUI && ruleType === 'account-assignment' ? '80vh' : 'auto',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {usePuzzleUI && ruleType === 'account-assignment' && '🧩'}
          {title}
          {usePuzzleUI && ruleType === 'account-assignment' && (
            <Chip 
              label="パズル型UI" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {renderFormContent()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}