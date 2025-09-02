/**
 * ルール管理システム用Firestoreユーティリティ
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { 
  AccountAssignmentRule, 
  TaxAssignmentRule, 
  DepartmentCashMapping, 
  DataFormatSettings,
  RuleFilters,
  RULE_COLLECTIONS 
} from '../../types/rules';
import { 
  RuleCollectionPaths, 
  FirestoreDataConverter,
  AccountAssignmentRuleDocument,
  TaxAssignmentRuleDocument,
  DepartmentCashMappingDocument,
  DataFormatSettingsDocument
} from './schemas/rules';

/**
 * ルール管理用Firestoreクラス
 */
export class RuleFirestoreService {
  private paths: RuleCollectionPaths;
  
  constructor(private companyId: string) {
    this.paths = new RuleCollectionPaths(companyId);
  }
  
  // 勘定科目割り当てルール操作
  async createAccountAssignmentRule(rule: Omit<AccountAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleData = {
      ...rule,
      createdAt: new Date(),
      companyId: this.companyId,
    };
    
    const docData = FirestoreDataConverter.toFirestoreDocument(ruleData, this.companyId);
    const docRef = await addDoc(collection(db, this.paths.accountAssignmentRules()), {
      ...docData,
      searchKeywords: FirestoreDataConverter.generateSearchKeywords(rule),
      ruleType: 'account_assignment',
    });
    
    return docRef.id;
  }  

  async getAccountAssignmentRules(filters?: RuleFilters): Promise<AccountAssignmentRule[]> {
    let q = query(collection(db, this.paths.accountAssignmentRules()));
    
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    if (filters?.effectiveDate) {
      q = query(q, where('effectiveFrom', '<=', Timestamp.fromDate(filters.effectiveDate)));
    }
    
    q = query(q, orderBy('priority'), orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => 
      FirestoreDataConverter.fromFirestoreDocument<AccountAssignmentRule>(doc)
    ).filter(Boolean) as AccountAssignmentRule[];
  }
  
  async updateAccountAssignmentRule(id: string, updates: Partial<AccountAssignmentRule>): Promise<void> {
    const docRef = doc(db, this.paths.accountAssignmentRules(id));
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    if (updates.name || updates.description) {
      updateData.searchKeywords = FirestoreDataConverter.generateSearchKeywords(updates);
    }
    
    await updateDoc(docRef, updateData);
  }
  
  async deleteAccountAssignmentRule(id: string): Promise<void> {
    const docRef = doc(db, this.paths.accountAssignmentRules(id));
    await deleteDoc(docRef);
  }
  
  // 税区分判定ルール操作
  async createTaxAssignmentRule(rule: Omit<TaxAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleData = {
      ...rule,
      createdAt: new Date(),
      companyId: this.companyId,
    };
    
    const docData = FirestoreDataConverter.toFirestoreDocument(ruleData, this.companyId);
    const docRef = await addDoc(collection(db, this.paths.taxAssignmentRules()), {
      ...docData,
      searchKeywords: FirestoreDataConverter.generateSearchKeywords(rule),
      ruleType: 'tax_assignment',
    });
    
    return docRef.id;
  }
  
  async getTaxAssignmentRules(filters?: RuleFilters): Promise<TaxAssignmentRule[]> {
    let q = query(collection(db, this.paths.taxAssignmentRules()));
    
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    q = query(q, orderBy('priority'), orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => 
      FirestoreDataConverter.fromFirestoreDocument<TaxAssignmentRule>(doc)
    ).filter(Boolean) as TaxAssignmentRule[];
  }  

  async updateTaxAssignmentRule(id: string, updates: Partial<TaxAssignmentRule>): Promise<void> {
    const docRef = doc(db, this.paths.taxAssignmentRules(id));
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
  }
  
  async deleteTaxAssignmentRule(id: string): Promise<void> {
    const docRef = doc(db, this.paths.taxAssignmentRules(id));
    await deleteDoc(docRef);
  }
  
  // 部門・現金補助科目マッピング操作
  async createDepartmentCashMapping(mapping: Omit<DepartmentCashMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const mappingData = {
      ...mapping,
      createdAt: new Date(),
      companyId: this.companyId,
    };
    
    const docData = FirestoreDataConverter.toFirestoreDocument(mappingData, this.companyId);
    const docRef = await addDoc(collection(db, this.paths.departmentCashMappings()), {
      ...docData,
      searchKeywords: FirestoreDataConverter.generateSearchKeywords(mapping),
      ruleType: 'department_mapping',
    });
    
    return docRef.id;
  }
  
  async getDepartmentCashMappings(): Promise<DepartmentCashMapping[]> {
    const q = query(
      collection(db, this.paths.departmentCashMappings()),
      where('isActive', '==', true),
      orderBy('departmentCode')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => 
      FirestoreDataConverter.fromFirestoreDocument<DepartmentCashMapping>(doc)
    ).filter(Boolean) as DepartmentCashMapping[];
  }
  
  async updateDepartmentCashMapping(id: string, updates: Partial<DepartmentCashMapping>): Promise<void> {
    const docRef = doc(db, this.paths.departmentCashMappings(id));
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
  }
  
  async deleteDepartmentCashMapping(id: string): Promise<void> {
    const docRef = doc(db, this.paths.departmentCashMappings(id));
    await deleteDoc(docRef);
  }  
  // データフォーマット設定操作
  async getDataFormatSettings(): Promise<DataFormatSettings | null> {
    const q = query(
      collection(db, this.paths.dataFormatSettings()),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return FirestoreDataConverter.fromFirestoreDocument<DataFormatSettings>(snapshot.docs[0]);
  }
  
  async updateDataFormatSettings(settings: Partial<DataFormatSettings>): Promise<void> {
    // 既存の設定を取得
    const current = await this.getDataFormatSettings();
    
    if (current) {
      // 既存設定を更新
      const docRef = doc(db, this.paths.dataFormatSettings(current.id));
      await updateDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      });
    } else {
      // 新規作成
      const settingsData = {
        ...settings,
        createdAt: new Date(),
        companyId: this.companyId,
        isActive: true,
        effectiveFrom: new Date(),
      };
      
      const docData = FirestoreDataConverter.toFirestoreDocument(settingsData, this.companyId);
      await addDoc(collection(db, this.paths.dataFormatSettings()), {
        ...docData,
        ruleType: 'data_format',
      });
    }
  }
  
  // ユーティリティメソッド
  async getRuleById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, `companies/${this.companyId}/${collectionName}/${id}`);
    const docSnap = await getDoc(docRef);
    
    return FirestoreDataConverter.fromFirestoreDocument<T>(docSnap);
  }
  
  async searchRules(searchTerm: string, ruleTypes?: string[]): Promise<any[]> {
    const results: any[] = [];
    const collections = ruleTypes || ['accountAssignmentRules', 'taxAssignmentRules', 'departmentCashMappings'];
    
    for (const collectionName of collections) {
      const q = query(
        collection(db, `companies/${this.companyId}/${collectionName}`),
        where('searchKeywords', 'array-contains', searchTerm.toLowerCase()),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        ...FirestoreDataConverter.fromFirestoreDocument(doc),
        collectionType: collectionName,
      }));
      
      results.push(...docs);
    }
    
    return results;
  }
}

// シングルトンファクトリー
const ruleServices = new Map<string, RuleFirestoreService>();

export function getRuleFirestoreService(companyId: string): RuleFirestoreService {
  if (!ruleServices.has(companyId)) {
    ruleServices.set(companyId, new RuleFirestoreService(companyId));
  }
  return ruleServices.get(companyId)!;
}

// 便利な関数エクスポート（API routes用）
export async function getAccountAssignmentRules(companyId: string): Promise<AccountAssignmentRule[]> {
  const service = getRuleFirestoreService(companyId);
  return service.getAccountAssignmentRules();
}

export async function getTaxAssignmentRules(companyId: string): Promise<TaxAssignmentRule[]> {
  const service = getRuleFirestoreService(companyId);
  return service.getTaxAssignmentRules();
}

export async function getDepartmentCashMappings(companyId: string): Promise<DepartmentCashMapping[]> {
  const service = getRuleFirestoreService(companyId);
  return service.getDepartmentCashMappings();
}

export async function getDataFormatSettings(companyId: string): Promise<DataFormatSettings> {
  const service = getRuleFirestoreService(companyId);
  return service.getDataFormatSettings();
}