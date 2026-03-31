/**
 * Pharmacy Service Tests
 * Tests for pharmacy registration, product management, and location-based queries
 */

import { PharmacyService } from '../../modules/pharmacy/pharmacy.service';
import { getFirestore } from '../../config/firebase';
import { createFirestoreMock } from '../mocks/firestore.mock';
import { ApprovalStatus } from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');
jest.mock('../../utils/helpers', () => ({
  calculateDistanceKm: jest.fn((_lat1, _lng1, _lat2, _lng2) => {
    const R = 6371;
    const dLat = ((_lat2 - _lat1) * Math.PI) / 180;
    const dLng = ((_lng2 - _lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((_lat1 * Math.PI) / 180) *
        Math.cos((_lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }),
}));

const mockFirestore = createFirestoreMock();

const createOperatingHours = () => ({
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '08:00', close: '14:00', closed: false },
  sunday: { open: '', close: '', closed: true },
});

describe('PharmacyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('registerPharmacy', () => {
    it('should register a new pharmacy', async () => {
      const ownerId = 'owner-123';
      const pharmacyData = {
        name: 'HealthCare Pharmacy',
        email: 'pharmacy@example.com',
        phoneNumber: '+2348012345678',
        address: '123 Medical St, Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-001',
        licenseDocUrl: 'https://example.com/license.pdf',
        cacNumber: 'CAC-2024-001',
        cacDocUrl: 'https://example.com/cac.pdf',
        ownerName: 'John Pharmacist',
        ownerIdDocUrl: 'https://example.com/id.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      expect(pharmacy).toBeDefined();
      expect(pharmacy.id).toBeDefined();
      expect(pharmacy.userId).toBe(ownerId);
      expect(pharmacy.name).toBe('HealthCare Pharmacy');
      expect(pharmacy.email).toBe('pharmacy@example.com');
      expect(pharmacy.approvalStatus).toBe(ApprovalStatus.PENDING);
      expect(pharmacy.isActive).toBe(true);
      expect(pharmacy.rating).toBe(0);
      expect(pharmacy.totalReviews).toBe(0);
    });

    it('should store all pharmacy documents', async () => {
      const ownerId = 'owner-456';
      const pharmacyData = {
        name: 'Document Test Pharmacy',
        email: 'docs@example.com',
        phoneNumber: '+2348012345679',
        address: '456 Doc St, Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-002',
        licenseDocUrl: 'https://example.com/license2.pdf',
        cacNumber: 'CAC-2024-002',
        cacDocUrl: 'https://example.com/cac2.pdf',
        ownerName: 'Jane Doctor',
        ownerIdDocUrl: 'https://example.com/id2.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      expect(pharmacy.licenseDocUrl).toBe('https://example.com/license2.pdf');
      expect(pharmacy.cacDocUrl).toBe('https://example.com/cac2.pdf');
      expect(pharmacy.ownerIdDocUrl).toBe('https://example.com/id2.pdf');
      expect(pharmacy.licenseNumber).toBe('PL-2024-002');
      expect(pharmacy.cacNumber).toBe('CAC-2024-002');
    });

    it('should store operating hours', async () => {
      const operatingHours = createOperatingHours();

      const pharmacy = await PharmacyService.registerPharmacy('owner-789', {
        name: 'Hours Test Pharmacy',
        email: 'hours@example.com',
        phoneNumber: '+2348012345680',
        address: '789 Hours St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-003',
        licenseDocUrl: 'https://example.com/license3.pdf',
        cacNumber: 'CAC-2024-003',
        cacDocUrl: 'https://example.com/cac3.pdf',
        ownerName: 'Owner Name',
        ownerIdDocUrl: 'https://example.com/id3.pdf',
        operatingHours,
      });

      expect(pharmacy.operatingHours).toEqual(operatingHours);
    });

    it('should store pharmacy in Firestore', async () => {
      const ownerId = 'owner-1000';
      const pharmacyData = {
        name: 'Firestore Test Pharmacy',
        email: 'firestore@example.com',
        phoneNumber: '+2348012345681',
        address: '1000 Firestore St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-004',
        licenseDocUrl: 'https://example.com/license4.pdf',
        cacNumber: 'CAC-2024-004',
        cacDocUrl: 'https://example.com/cac4.pdf',
        ownerName: 'Owner',
        ownerIdDocUrl: 'https://example.com/id4.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const collectionData = mockFirestore.getCollectionData();
      const pharmacies = collectionData['pharmacies'];
      expect(pharmacies).toBeDefined();
      expect(pharmacies.some((p) => p.id === pharmacy.id)).toBe(true);
    });
  });

  describe('getPharmacy', () => {
    it('should retrieve an existing pharmacy', async () => {
      const ownerId = 'owner-2000';
      const pharmacyData = {
        name: 'Retrieve Test Pharmacy',
        email: 'retrieve@example.com',
        phoneNumber: '+2348012345682',
        address: '2000 Retrieve St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-005',
        licenseDocUrl: 'https://example.com/license5.pdf',
        cacNumber: 'CAC-2024-005',
        cacDocUrl: 'https://example.com/cac5.pdf',
        ownerName: 'Retriever',
        ownerIdDocUrl: 'https://example.com/id5.pdf',
        operatingHours: createOperatingHours(),
      };

      const created = await PharmacyService.registerPharmacy(ownerId, pharmacyData);
      const retrieved = await PharmacyService.getPharmacy(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Retrieve Test Pharmacy');
    });

    it('should return null for non-existent pharmacy', async () => {
      const pharmacy = await PharmacyService.getPharmacy('non-existent-id');
      expect(pharmacy).toBeNull();
    });
  });

  describe('getPharmacyByUserId', () => {
    it('should retrieve pharmacy by owner user ID', async () => {
      const ownerId = 'owner-3000';
      const pharmacyData = {
        name: 'UserId Test Pharmacy',
        email: 'userid@example.com',
        phoneNumber: '+2348012345683',
        address: '3000 UserId St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-006',
        licenseDocUrl: 'https://example.com/license6.pdf',
        cacNumber: 'CAC-2024-006',
        cacDocUrl: 'https://example.com/cac6.pdf',
        ownerName: 'UserOwner',
        ownerIdDocUrl: 'https://example.com/id6.pdf',
        operatingHours: createOperatingHours(),
      };

      await PharmacyService.registerPharmacy(ownerId, pharmacyData);
      const pharmacy = await PharmacyService.getPharmacyByUserId(ownerId);

      expect(pharmacy).toBeDefined();
      expect(pharmacy?.userId).toBe(ownerId);
      expect(pharmacy?.name).toBe('UserId Test Pharmacy');
    });

    it('should return null for user with no pharmacy', async () => {
      const pharmacy = await PharmacyService.getPharmacyByUserId('user-with-no-pharmacy');
      expect(pharmacy).toBeNull();
    });
  });

  describe('updatePharmacy', () => {
    it('should update pharmacy information', async () => {
      const ownerId = 'owner-4000';
      const pharmacyData = {
        name: 'Update Test Pharmacy',
        email: 'update@example.com',
        phoneNumber: '+2348012345684',
        address: '4000 Update St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-007',
        licenseDocUrl: 'https://example.com/license7.pdf',
        cacNumber: 'CAC-2024-007',
        cacDocUrl: 'https://example.com/cac7.pdf',
        ownerName: 'Updater',
        ownerIdDocUrl: 'https://example.com/id7.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const updated = await PharmacyService.updatePharmacy(pharmacy.id, {
        approvalStatus: ApprovalStatus.APPROVED,
        phoneNumber: '+2348099999999',
      });

      expect(updated.approvalStatus).toBe(ApprovalStatus.APPROVED);
      expect(updated.phoneNumber).toBe('+2348099999999');
      expect(updated.name).toBe('Update Test Pharmacy');
    });

    it('should update approval status', async () => {
      const ownerId = 'owner-5000';
      const pharmacyData = {
        name: 'Approval Pharmacy',
        email: 'approval@example.com',
        phoneNumber: '+2348012345685',
        address: '5000 Approval St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-008',
        licenseDocUrl: 'https://example.com/license8.pdf',
        cacNumber: 'CAC-2024-008',
        cacDocUrl: 'https://example.com/cac8.pdf',
        ownerName: 'Approver',
        ownerIdDocUrl: 'https://example.com/id8.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      expect(pharmacy.approvalStatus).toBe(ApprovalStatus.PENDING);

      const approved = await PharmacyService.updatePharmacy(pharmacy.id, {
        approvalStatus: ApprovalStatus.APPROVED,
      });

      expect(approved.approvalStatus).toBe(ApprovalStatus.APPROVED);
    });

    it('should update rating and reviews', async () => {
      const ownerId = 'owner-6000';
      const pharmacyData = {
        name: 'Rating Pharmacy',
        email: 'rating@example.com',
        phoneNumber: '+2348012345686',
        address: '6000 Rating St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-009',
        licenseDocUrl: 'https://example.com/license9.pdf',
        cacNumber: 'CAC-2024-009',
        cacDocUrl: 'https://example.com/cac9.pdf',
        ownerName: 'Rater',
        ownerIdDocUrl: 'https://example.com/id9.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const updated = await PharmacyService.updatePharmacy(pharmacy.id, {
        rating: 4.5,
        totalReviews: 50,
      });

      expect(updated.rating).toBe(4.5);
      expect(updated.totalReviews).toBe(50);
    });
  });

  describe('getNearbyPharmacies', () => {
    it('should find pharmacies within radius', async () => {
      const pharmaData1 = {
        name: 'Nearby Pharmacy 1',
        email: 'nearby1@example.com',
        phoneNumber: '+2348012345687',
        address: 'Location 1',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-010',
        licenseDocUrl: 'https://example.com/license10.pdf',
        cacNumber: 'CAC-2024-010',
        cacDocUrl: 'https://example.com/cac10.pdf',
        ownerName: 'Owner1',
        ownerIdDocUrl: 'https://example.com/id10.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy1 = await PharmacyService.registerPharmacy('owner-7000', pharmaData1);
      await PharmacyService.updatePharmacy(pharmacy1.id, {
        approvalStatus: ApprovalStatus.APPROVED,
      });

      const nearby = await PharmacyService.getNearbyPharmacies(6.5244, 3.3792, 20);

      expect(Array.isArray(nearby)).toBe(true);
      expect(nearby.every((p) => p.approvalStatus === ApprovalStatus.APPROVED)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        const pharmaData = {
          name: `Limit Test Pharmacy ${i}`,
          email: `limit${i}@example.com`,
          phoneNumber: `+234801234568${i}`,
          address: `Location ${i}`,
          latitude: 6.5244 + i * 0.0001,
          longitude: 3.3792 + i * 0.0001,
          licenseNumber: `PL-2024-${11 + i}`,
          licenseDocUrl: `https://example.com/license${11 + i}.pdf`,
          cacNumber: `CAC-2024-${11 + i}`,
          cacDocUrl: `https://example.com/cac${11 + i}.pdf`,
          ownerName: `Owner${i}`,
          ownerIdDocUrl: `https://example.com/id${11 + i}.pdf`,
          operatingHours: createOperatingHours(),
        };

        const pharmacy = await PharmacyService.registerPharmacy(`owner-${8000 + i}`, pharmaData);
        await PharmacyService.updatePharmacy(pharmacy.id, {
          approvalStatus: ApprovalStatus.APPROVED,
        });
      }

      const nearby = await PharmacyService.getNearbyPharmacies(6.5244, 3.3792, 20, 3);

      expect(nearby.length).toBeLessThanOrEqual(3);
    });

    it('should only return active pharmacies', async () => {
      const pharmaData = {
        name: 'Inactive Pharmacy',
        email: 'inactive@example.com',
        phoneNumber: '+2348012345699',
        address: 'Inactive Location',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-020',
        licenseDocUrl: 'https://example.com/license20.pdf',
        cacNumber: 'CAC-2024-020',
        cacDocUrl: 'https://example.com/cac20.pdf',
        ownerName: 'InactiveOwner',
        ownerIdDocUrl: 'https://example.com/id20.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy('owner-9000', pharmaData);
      await PharmacyService.updatePharmacy(pharmacy.id, {
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: false,
      });

      const nearby = await PharmacyService.getNearbyPharmacies(6.5244, 3.3792, 20);

      expect(nearby.every((p) => p.isActive === true)).toBe(true);
    });
  });

  describe('addProduct', () => {
    it('should add product to pharmacy', async () => {
      const ownerId = 'owner-10000';
      const pharmacyData = {
        name: 'Product Pharmacy',
        email: 'products@example.com',
        phoneNumber: '+2348012345700',
        address: '10000 Product St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-021',
        licenseDocUrl: 'https://example.com/license21.pdf',
        cacNumber: 'CAC-2024-021',
        cacDocUrl: 'https://example.com/cac21.pdf',
        ownerName: 'ProductOwner',
        ownerIdDocUrl: 'https://example.com/id21.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const product = await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'aspirin-100mg',
        sku: 'ASP-100-001',
        quantity: 100,
        price: 500,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-2024-001',
      });

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.pharmacyId).toBe(pharmacy.id);
      expect(product.drugCatalogItemId).toBe('aspirin-100mg');
      expect(product.quantity).toBe(100);
      expect(product.price).toBe(500);
      expect(product.isActive).toBe(true);
    });

    it('should add product with discount', async () => {
      const ownerId = 'owner-11000';
      const pharmacyData = {
        name: 'Discount Pharmacy',
        email: 'discount@example.com',
        phoneNumber: '+2348012345701',
        address: '11000 Discount St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-022',
        licenseDocUrl: 'https://example.com/license22.pdf',
        cacNumber: 'CAC-2024-022',
        cacDocUrl: 'https://example.com/cac22.pdf',
        ownerName: 'DiscountOwner',
        ownerIdDocUrl: 'https://example.com/id22.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const product = await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'ibuprofen-200mg',
        sku: 'IBU-200-001',
        quantity: 50,
        price: 800,
        discount: 10,
        expiryDate: new Date('2025-06-30'),
        batchNumber: 'BATCH-2024-002',
      });

      expect(product.discount).toBe(10);
    });

    it('should store product in Firestore', async () => {
      const ownerId = 'owner-12000';
      const pharmacyData = {
        name: 'Firestore Product Pharmacy',
        email: 'fsprod@example.com',
        phoneNumber: '+2348012345702',
        address: '12000 FSProd St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-023',
        licenseDocUrl: 'https://example.com/license23.pdf',
        cacNumber: 'CAC-2024-023',
        cacDocUrl: 'https://example.com/cac23.pdf',
        ownerName: 'FSProdOwner',
        ownerIdDocUrl: 'https://example.com/id23.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const product = await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'paracetamol-500mg',
        sku: 'PAR-500-001',
        quantity: 200,
        price: 1000,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-2024-003',
      });

      const collectionData = mockFirestore.getCollectionData();
      const products = collectionData['pharmacy_products'];
      expect(products).toBeDefined();
      expect(products.some((p) => p.id === product.id)).toBe(true);
    });
  });

  describe('getPharmacyProducts', () => {
    it('should retrieve all active products for pharmacy', async () => {
      const ownerId = 'owner-13000';
      const pharmacyData = {
        name: 'Multi Product Pharmacy',
        email: 'multiprod@example.com',
        phoneNumber: '+2348012345703',
        address: '13000 MultiProd St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-024',
        licenseDocUrl: 'https://example.com/license24.pdf',
        cacNumber: 'CAC-2024-024',
        cacDocUrl: 'https://example.com/cac24.pdf',
        ownerName: 'MultiProdOwner',
        ownerIdDocUrl: 'https://example.com/id24.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'drug-1',
        sku: 'SKU-1',
        quantity: 10,
        price: 100,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-1',
      });

      await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'drug-2',
        sku: 'SKU-2',
        quantity: 20,
        price: 200,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-2',
      });

      const products = await PharmacyService.getPharmacyProducts(pharmacy.id);

      expect(products.length).toBeGreaterThanOrEqual(2);
      expect(products.every((p) => p.pharmacyId === pharmacy.id)).toBe(true);
      expect(products.every((p) => p.isActive === true)).toBe(true);
    });

    it('should return empty array for pharmacy with no products', async () => {
      const ownerId = 'owner-14000';
      const pharmacyData = {
        name: 'No Products Pharmacy',
        email: 'noproducts@example.com',
        phoneNumber: '+2348012345704',
        address: '14000 NoProducts St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-025',
        licenseDocUrl: 'https://example.com/license25.pdf',
        cacNumber: 'CAC-2024-025',
        cacDocUrl: 'https://example.com/cac25.pdf',
        ownerName: 'NoProductsOwner',
        ownerIdDocUrl: 'https://example.com/id25.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const products = await PharmacyService.getPharmacyProducts(pharmacy.id);

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });
  });

  describe('updateProduct', () => {
    it('should update product price', async () => {
      const ownerId = 'owner-15000';
      const pharmacyData = {
        name: 'Update Product Pharmacy',
        email: 'updateprod@example.com',
        phoneNumber: '+2348012345705',
        address: '15000 UpdateProd St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-026',
        licenseDocUrl: 'https://example.com/license26.pdf',
        cacNumber: 'CAC-2024-026',
        cacDocUrl: 'https://example.com/cac26.pdf',
        ownerName: 'UpdateProdOwner',
        ownerIdDocUrl: 'https://example.com/id26.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const product = await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'drug-update',
        sku: 'SKU-UPDATE',
        quantity: 100,
        price: 1000,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-UPDATE',
      });

      const updated = await PharmacyService.updateProduct(product.id, {
        price: 1200,
      });

      expect(updated.price).toBe(1200);
      expect(updated.quantity).toBe(100);
    });

    it('should update product quantity', async () => {
      const ownerId = 'owner-16000';
      const pharmacyData = {
        name: 'Quantity Update Pharmacy',
        email: 'qtyupdate@example.com',
        phoneNumber: '+2348012345706',
        address: '16000 QtyUpdate St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-027',
        licenseDocUrl: 'https://example.com/license27.pdf',
        cacNumber: 'CAC-2024-027',
        cacDocUrl: 'https://example.com/cac27.pdf',
        ownerName: 'QtyUpdateOwner',
        ownerIdDocUrl: 'https://example.com/id27.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const product = await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'drug-qty',
        sku: 'SKU-QTY',
        quantity: 50,
        price: 500,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-QTY',
      });

      const updated = await PharmacyService.updateProduct(product.id, {
        quantity: 30,
      });

      expect(updated.quantity).toBe(30);
      expect(updated.price).toBe(500);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product (mark inactive)', async () => {
      const ownerId = 'owner-17000';
      const pharmacyData = {
        name: 'Delete Product Pharmacy',
        email: 'deleteprod@example.com',
        phoneNumber: '+2348012345707',
        address: '17000 DeleteProd St',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-028',
        licenseDocUrl: 'https://example.com/license28.pdf',
        cacNumber: 'CAC-2024-028',
        cacDocUrl: 'https://example.com/cac28.pdf',
        ownerName: 'DeleteProdOwner',
        ownerIdDocUrl: 'https://example.com/id28.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy(ownerId, pharmacyData);

      const product = await PharmacyService.addProduct(pharmacy.id, {
        drugCatalogItemId: 'drug-delete',
        sku: 'SKU-DELETE',
        quantity: 100,
        price: 1000,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-DELETE',
      });

      expect(product.isActive).toBe(true);

      await PharmacyService.deleteProduct(product.id);

      const products = await PharmacyService.getPharmacyProducts(pharmacy.id);
      expect(products.every((p) => p.id !== product.id)).toBe(true);
    });
  });

  describe('searchPharmacies', () => {
    it('should search pharmacies by name', async () => {
      const pharmacyData = {
        name: 'Search Test Pharmacy',
        email: 'search@example.com',
        phoneNumber: '+2348012345708',
        address: 'Search Address',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-029',
        licenseDocUrl: 'https://example.com/license29.pdf',
        cacNumber: 'CAC-2024-029',
        cacDocUrl: 'https://example.com/cac29.pdf',
        ownerName: 'SearchOwner',
        ownerIdDocUrl: 'https://example.com/id29.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy('owner-18000', pharmacyData);
      await PharmacyService.updatePharmacy(pharmacy.id, {
        approvalStatus: ApprovalStatus.APPROVED,
      });

      const results = await PharmacyService.searchPharmacies('Search');

      expect(Array.isArray(results)).toBe(true);
      expect(results.some((p) => p.id === pharmacy.id)).toBe(true);
    });

    it('should search pharmacies by address', async () => {
      const pharmacyData = {
        name: 'Address Pharmacy',
        email: 'address@example.com',
        phoneNumber: '+2348012345709',
        address: 'Unique Address Location 999',
        latitude: 6.5244,
        longitude: 3.3792,
        licenseNumber: 'PL-2024-030',
        licenseDocUrl: 'https://example.com/license30.pdf',
        cacNumber: 'CAC-2024-030',
        cacDocUrl: 'https://example.com/cac30.pdf',
        ownerName: 'AddressOwner',
        ownerIdDocUrl: 'https://example.com/id30.pdf',
        operatingHours: createOperatingHours(),
      };

      const pharmacy = await PharmacyService.registerPharmacy('owner-19000', pharmacyData);
      await PharmacyService.updatePharmacy(pharmacy.id, {
        approvalStatus: ApprovalStatus.APPROVED,
      });

      const results = await PharmacyService.searchPharmacies('Unique');

      expect(Array.isArray(results)).toBe(true);
      expect(results.some((p) => p.id === pharmacy.id)).toBe(true);
    });
  });
});
