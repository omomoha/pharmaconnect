/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Firestore Mock Helper
 * Provides utilities to mock Firestore database operations
 */

export const createFirestoreMock = () => {
  const mockDocData: Record<string, any> = {};
  const mockCollectionData: Record<string, any[]> = {};

  /**
   * Resolve FieldValue sentinels (like increment) into actual values.
   * firebase-admin's FieldValue.increment() returns an object like { operand: N }.
   */
  const resolveFieldValues = (existing: any, updates: any): any => {
    const resolved: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && 'operand' in (value as any)) {
        // FieldValue.increment — apply the operand to the current value
        const currentVal = existing?.[key] ?? 0;
        resolved[key] = currentVal + (value as any).operand;
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  };

  const mockDocRef = (collectionName: string, docId: string): any => ({
    set: jest.fn((data: any) => {
      mockDocData[docId] = data;
      // Also add to collection data with id field
      const docWithId = { ...data, id: docId };
      const existing = mockCollectionData[collectionName].findIndex(d => d.id === docId);
      if (existing >= 0) {
        mockCollectionData[collectionName][existing] = docWithId;
      } else {
        mockCollectionData[collectionName].push(docWithId);
      }
      return Promise.resolve();
    }),
    get: jest.fn(() =>
      Promise.resolve({
        exists: !!mockDocData[docId],
        data: () => mockDocData[docId],
      })
    ),
    update: jest.fn((data: any) => {
      const resolved = resolveFieldValues(mockDocData[docId], data);
      mockDocData[docId] = { ...mockDocData[docId], ...resolved };
      // Also update in collection data
      const existing = mockCollectionData[collectionName].findIndex(d => d.id === docId);
      if (existing >= 0) {
        mockCollectionData[collectionName][existing] = { ...mockCollectionData[collectionName][existing], ...resolved };
      }
      return Promise.resolve();
    }),
    delete: jest.fn(() => {
      delete mockDocData[docId];
      const idx = mockCollectionData[collectionName].findIndex(d => d.id === docId);
      if (idx >= 0) {
        mockCollectionData[collectionName].splice(idx, 1);
      }
      return Promise.resolve();
    }),
    // Subcollection support: doc("orderId").collection("guest_info").doc("contact")
    collection: jest.fn((subCollectionName: string) => {
      const fullCollectionName = `${collectionName}/${docId}/${subCollectionName}`;
      return mockCollectionRef(fullCollectionName);
    }),
  });

  const createQueryChain = (collectionName: string, filtered: any[]): any => {
    const orderByChain = (field: string, direction: string = 'asc') => {
      const sorted = [...filtered].sort((a, b) => {
        if (direction === 'desc') {
          return b[field] > a[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });

      return {
        limit: jest.fn((limit: number) => ({
          get: jest.fn(() => {
            const sliced = sorted.slice(0, limit);
            return Promise.resolve({
              empty: sliced.length === 0,
              size: sliced.length,
              docs: sliced.map((doc) => ({
                id: doc.id,
                exists: true,
                data: () => doc,
              })),
            });
          }),
        })),
        get: jest.fn(() =>
          Promise.resolve({
            empty: sorted.length === 0,
            size: sorted.length,
            docs: sorted.map((doc) => ({
              id: doc.id,
              exists: true,
              data: () => doc,
            })),
          })
        ),
      };
    };

    return {
      where: jest.fn((field: string, operator: string, value: any) => {
        const refiltered = filtered.filter((item) => {
          if (operator === '==') return item[field] === value;
          if (operator === '!=') return item[field] !== value;
          if (operator === '>') return item[field] > value;
          if (operator === '<') return item[field] < value;
          if (operator === '>=') return item[field] >= value;
          if (operator === '<=') return item[field] <= value;
          return false;
        });
        return createQueryChain(collectionName, refiltered);
      }),
      orderBy: jest.fn(orderByChain),
      limit: jest.fn((limitNum: number) => ({
        get: jest.fn(() => {
          const sliced = filtered.slice(0, limitNum);
          return Promise.resolve({
            empty: sliced.length === 0,
            size: sliced.length,
            docs: sliced.map((doc) => ({
              id: doc.id,
              exists: true,
              data: () => doc,
            })),
            forEach: (callback: any) => {
              sliced.forEach((doc) => {
                callback({
                  id: doc.id,
                  exists: true,
                  data: () => doc,
                });
              });
            },
          });
        }),
      })),
      get: jest.fn(() =>
        Promise.resolve({
          empty: filtered.length === 0,
          size: filtered.length,
          docs: filtered.map((doc) => ({
            id: doc.id,
            exists: true,
            data: () => doc,
          })),
          forEach: (callback: any) => {
            filtered.forEach((doc) => {
              callback({
                id: doc.id,
                exists: true,
                data: () => doc,
              });
            });
          },
        })
      ),
    };
  };

  const mockCollectionRef = (collectionName: string) => {
    if (!mockCollectionData[collectionName]) {
      mockCollectionData[collectionName] = [];
    }

    return {
      doc: jest.fn((docId: string) => mockDocRef(collectionName, docId)),
      where: jest.fn((field: string, operator: string, value: any) => {
        const filtered = mockCollectionData[collectionName].filter((item) => {
          if (operator === '==') return item[field] === value;
          if (operator === '!=') return item[field] !== value;
          if (operator === '>') return item[field] > value;
          if (operator === '<') return item[field] < value;
          if (operator === '>=') return item[field] >= value;
          if (operator === '<=') return item[field] <= value;
          return false;
        });
        return createQueryChain(collectionName, filtered);
      }),
      get: jest.fn(() =>
        Promise.resolve({
          empty: mockCollectionData[collectionName].length === 0,
          size: mockCollectionData[collectionName].length,
          docs: mockCollectionData[collectionName].map((doc) => ({
            id: doc.id,
            exists: true,
            data: () => doc,
          })),
        })
      ),
      orderBy: jest.fn((field: string, direction: string = 'asc') => {
        const sorted = [...mockCollectionData[collectionName]].sort((a, b) => {
          if (direction === 'desc') {
            return b[field] > a[field] ? 1 : -1;
          }
          return a[field] > b[field] ? 1 : -1;
        });
        return createQueryChain(collectionName, sorted);
      }),
      add: jest.fn((data: any) => {
        const id = `doc_${Date.now()}`;
        const docWithId = { ...data, id };
        mockCollectionData[collectionName].push(docWithId);
        mockDocData[id] = data;
        return Promise.resolve({ id });
      }),
    };
  };

  // Batch write support
  const createBatchMock = () => {
    const ops: Array<{ type: string; ref: any; data?: any }> = [];

    return {
      set: jest.fn((ref: any, data: any) => {
        ops.push({ type: 'set', ref, data });
      }),
      update: jest.fn((ref: any, data: any) => {
        ops.push({ type: 'update', ref, data });
      }),
      delete: jest.fn((ref: any) => {
        ops.push({ type: 'delete', ref });
      }),
      commit: jest.fn(async () => {
        // Execute all batched operations
        for (const op of ops) {
          if (op.type === 'set') {
            await op.ref.set(op.data);
          } else if (op.type === 'update') {
            await op.ref.update(op.data);
          } else if (op.type === 'delete') {
            await op.ref.delete();
          }
        }
        return Promise.resolve();
      }),
    };
  };

  // Transaction mock — provides the same doc/update/set interface
  // but executed synchronously within the callback
  const createTransactionMock = () => {
    return {
      get: jest.fn((ref: any) => ref.get()),
      set: jest.fn((ref: any, data: any) => ref.set(data)),
      update: jest.fn((ref: any, data: any) => ref.update(data)),
      delete: jest.fn((ref: any) => ref.delete()),
    };
  };

  return {
    collection: jest.fn((collectionName: string) => mockCollectionRef(collectionName)),
    batch: jest.fn(() => createBatchMock()),
    runTransaction: jest.fn(async (updateFunction: (transaction: any) => Promise<any>) => {
      const transaction = createTransactionMock();
      return await updateFunction(transaction);
    }),
    getDocData: () => mockDocData,
    getCollectionData: () => mockCollectionData,
    reset: () => {
      Object.keys(mockDocData).forEach((key) => delete mockDocData[key]);
      Object.keys(mockCollectionData).forEach((key) => delete mockCollectionData[key]);
    },
  };
};

export const createAuthMock = () => {
  const mockUsers: Record<string, any> = {};

  return {
    verifyIdToken: jest.fn((_token: string) =>
      Promise.resolve({
        uid: 'test-user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ),
    getUser: jest.fn((uid: string) =>
      Promise.resolve({
        uid,
        email: 'test@example.com',
        customClaims: { role: 'customer' },
      })
    ),
    createUser: jest.fn((data: any) => {
      const uid = `user_${Date.now()}`;
      mockUsers[uid] = data;
      return Promise.resolve({ uid });
    }),
    setCustomUserClaims: jest.fn((uid: string, claims: any) => {
      if (mockUsers[uid]) {
        mockUsers[uid].customClaims = claims;
      }
      return Promise.resolve();
    }),
    updateUser: jest.fn((uid: string, data: any) => {
      if (mockUsers[uid]) {
        mockUsers[uid] = { ...mockUsers[uid], ...data };
      } else {
        mockUsers[uid] = data;
      }
      return Promise.resolve({ uid });
    }),
  };
};

export const createRedisMock = () => {
  const mockData: Record<string, any> = {};

  return {
    get: jest.fn((key: string) => Promise.resolve(mockData[key] || null)),
    set: jest.fn((key: string, value: any) => {
      mockData[key] = value;
      return Promise.resolve('OK');
    }),
    del: jest.fn((key: string) => {
      delete mockData[key];
      return Promise.resolve(1);
    }),
    incr: jest.fn((key: string) => {
      mockData[key] = (mockData[key] || 0) + 1;
      return Promise.resolve(mockData[key]);
    }),
    expire: jest.fn((_key: string, _seconds: number) => Promise.resolve(1)),
    setex: jest.fn((key: string, _seconds: number, value: any) => {
      mockData[key] = value;
      return Promise.resolve('OK');
    }),
    flushdb: jest.fn(() => {
      Object.keys(mockData).forEach((key) => delete mockData[key]);
      return Promise.resolve('OK');
    }),
  };
};
