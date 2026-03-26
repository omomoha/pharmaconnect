/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Firestore Mock Helper
 * Provides utilities to mock Firestore database operations
 */

export const createFirestoreMock = () => {
  const mockDocData: Record<string, any> = {};
  const mockCollectionData: Record<string, any[]> = {};

  const mockDocRef = (collectionName: string, docId: string) => ({
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
      mockDocData[docId] = { ...mockDocData[docId], ...data };
      // Also update in collection data
      const existing = mockCollectionData[collectionName].findIndex(d => d.id === docId);
      if (existing >= 0) {
        mockCollectionData[collectionName][existing] = { ...mockCollectionData[collectionName][existing], ...data };
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
          get: jest.fn(() =>
            Promise.resolve({
              empty: sorted.length === 0,
              docs: sorted.slice(0, limit).map((doc) => ({
                exists: true,
                data: () => doc,
              })),
            })
          ),
        })),
        get: jest.fn(() =>
          Promise.resolve({
            empty: sorted.length === 0,
            docs: sorted.map((doc) => ({
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
          if (operator === '>') return item[field] > value;
          if (operator === '<') return item[field] < value;
          return false;
        });
        return createQueryChain(collectionName, refiltered);
      }),
      orderBy: jest.fn(orderByChain),
      limit: jest.fn((limit: number) => ({
        get: jest.fn(() =>
          Promise.resolve({
            empty: filtered.length === 0,
            docs: filtered.slice(0, limit).map((doc) => ({
              exists: true,
              data: () => doc,
            })),
          })
        ),
      })),
      get: jest.fn(() =>
        Promise.resolve({
          empty: filtered.length === 0,
          docs: filtered.map((doc) => ({
            exists: true,
            data: () => doc,
          })),
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
          if (operator === '>') return item[field] > value;
          if (operator === '<') return item[field] < value;
          return false;
        });
        return createQueryChain(collectionName, filtered);
      }),
      get: jest.fn(() =>
        Promise.resolve({
          empty: mockCollectionData[collectionName].length === 0,
          docs: mockCollectionData[collectionName].map((doc) => ({
            exists: true,
            data: () => doc,
          })),
        })
      ),
      add: jest.fn((data: any) => {
        const id = `doc_${Date.now()}`;
        const docWithId = { ...data, id };
        mockCollectionData[collectionName].push(docWithId);
        mockDocData[id] = data;
        return Promise.resolve({ id });
      }),
    };
  };

  return {
    collection: jest.fn((collectionName: string) => mockCollectionRef(collectionName)),
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
