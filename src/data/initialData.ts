import type { 
  CarbonProject, 
  StellarTransaction, 
  UserHolding, 
  RetirementCertificate, 
  Verifier, 
  ProjectSubmission 
} from '../types';

export const INITIAL_PROJECTS: CarbonProject[] = [
  {
    id: 'proj-rimba-raya',
    name: 'Rimba Raya Biodiversity Reserve REDD+',
    slug: 'rimba-raya-reserve',
    description: 'Located in Central Kalimantan, Indonesia, Rimba Raya protects 64,000 hectares of critical tropical peat swamp forest from conversion to palm oil plantations. It prevents the release of over 130 million tonnes of carbon emissions while safeguarding one of the largest remaining contiguous populations of the endangered Bornean Orangutan. The project funds 65 local community development initiatives, potable water filtration, and solar lighting.',
    shortDescription: 'Preserving 64,000 hectares of critical peat swamp forest and endangered orangutan habitat in Central Kalimantan.',
    location: 'Central Kalimantan, Borneo',
    country: 'Indonesia',
    countryCode: 'ID',
    category: 'forestry',
    standard: 'Verra VCS',
    registryId: 'VCS-844',
    registryUrl: 'https://registry.verra.org/app/projectDetail/VCS/844',
    vintage: 2024,
    pricePerTon: 18.50,
    availableCredits: 84200,
    totalCredits: 350000,
    rating: 'AAA',
    sdgGoals: [13, 15, 8, 6, 17],
    imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
    ],
    developer: {
      name: 'InfiniteEARTH Global Ltd',
      address: 'GDQ2XR4MVH73K527M67POGW7M4LQ5XJ2T7O7KPYQZ2N7C9K',
      contactEmail: 'verifications@infinite-earth.io',
      verified: true
    },
    mrvData: {
      auditor: 'SGS United Kingdom & DNV',
      methodology: 'VM0007 REDD+ Tropical Peatland v1.6',
      monitoringPeriod: 'Jan 2023 - Dec 2024',
      canopyDensity: '98.2% Intact (Sentinel-2 Telemetry)',
      co2SequesteredAnnual: 3500000,
      satelliteVerified: true,
      bufferPoolPercent: 18.5,
      lastAuditDate: '2026-08-14'
    },
    coordinates: {
      lat: -2.8541,
      lng: 112.4589
    },
    stellarAsset: {
      code: 'GRN-RIMBA',
      issuer: 'GBV4L7QMWX4632KJL4B6DCEV4GZPLJ9R58KNM7P2X4T6Y',
      contractId: 'CB7Y9M2XQW876543210POIUYTREWQASDFGHJKLMNBVCXZ1',
      ledgerSynced: true
    },
    status: 'active',
    featured: true
  },
  {
    id: 'proj-orca-dac',
    name: 'Orca & Mammoth Direct Air Capture & Mineralization',
    slug: 'orca-mammoth-dac',
    description: 'Operating in Hellisheiði, Iceland, this pioneering direct air capture (DAC) and basalt mineralization facility chemically scrubs atmospheric CO2 using 100% geothermal energy. The sequestered CO2 is dissolved in water and pumped deep underground into basalt formations where natural mineralization converts it permanently into stone in less than two years with >10,000 year permanence.',
    shortDescription: 'Permanent engineered atmospheric CO2 removal utilizing geothermal energy and basalt mineralization.',
    location: 'Hellisheiði Geothermal Plateau',
    country: 'Iceland',
    countryCode: 'IS',
    category: 'direct-air-capture',
    standard: 'Puro.earth',
    registryId: 'CORC-9201',
    registryUrl: 'https://puro.earth/corc-registry/9201',
    vintage: 2025,
    pricePerTon: 128.00,
    availableCredits: 12400,
    totalCredits: 36000,
    rating: 'AAA',
    sdgGoals: [13, 9, 12],
    imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=1200&q=80',
    developer: {
      name: 'Carbfix & Climeworks Consortium',
      address: 'GCKT6Y9WPRQ5A672M87BCDE45GTYUJ98765LKJHGFDSAQ1',
      contactEmail: 'carbon@carbfix.is',
      verified: true
    },
    mrvData: {
      auditor: 'DNV GL Business Assurance',
      methodology: 'Puro Direct Air Carbon Capture and Storage (DACCS)',
      monitoringPeriod: 'Continuous IoT Mass-Flow Spectrometry',
      co2SequesteredAnnual: 40000,
      satelliteVerified: true,
      bufferPoolPercent: 5.0,
      lastAuditDate: '2026-10-01'
    },
    coordinates: {
      lat: 64.0381,
      lng: -21.4019
    },
    stellarAsset: {
      code: 'GRN-ORCA',
      issuer: 'GBL829XMVQWERT4567890ASDFGHJKLMNBVCXZPOIUYTRE2',
      contractId: 'CD8Z7X6W5V4U3T2S1R0QPONMLKJIHGFEDCBA987654321',
      ledgerSynced: true
    },
    status: 'active',
    featured: true
  },
  {
    id: 'proj-mikoko-pamoja',
    name: 'Mikoko Pamoja Coastal Mangrove Blue Carbon',
    slug: 'mikoko-pamoja-mangroves',
    description: 'The world\'s premier community-led mangrove conservation and restoration project in Gazi Bay, Kenya. Mangroves sequester up to 10 times more carbon per hectare than terrestrial tropical rainforests. The revenues fund clean community drinking water pumps, school supplies for 700 children, and coastal storm surge protection for fishing villages.',
    shortDescription: 'Pioneering community-managed coastal mangrove conservation sequestering high-density blue carbon.',
    location: 'Gazi Bay, Kwale County',
    country: 'Kenya',
    countryCode: 'KE',
    category: 'blue-carbon',
    standard: 'Plan Vivo',
    registryId: 'PV-089',
    registryUrl: 'https://www.planvivo.org/mikoko-pamoja',
    vintage: 2024,
    pricePerTon: 29.75,
    availableCredits: 28150,
    totalCredits: 75000,
    rating: 'AA+',
    sdgGoals: [14, 13, 1, 5, 8],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    developer: {
      name: 'Gazi Community Blue Carbon Trust',
      address: 'GDPT78MNBVCXZASDFGHJKLPOIUYTREWQ1234567890AB',
      contactEmail: 'trust@mikokopamoja.org',
      verified: true
    },
    mrvData: {
      auditor: 'TÜV SÜD South Asia',
      methodology: 'Plan Vivo Standard Coastal Ecosystems v3.1',
      monitoringPeriod: 'Feb 2023 - Jan 2025',
      canopyDensity: '95.4% Biomass Index (Drone LiDAR)',
      co2SequesteredAnnual: 75000,
      satelliteVerified: true,
      bufferPoolPercent: 12.0,
      lastAuditDate: '2026-07-22'
    },
    coordinates: {
      lat: -4.4258,
      lng: 39.5108
    },
    stellarAsset: {
      code: 'GRN-MIKOKO',
      issuer: 'GCL99887766554433221100AABBCCDDEEFFGGHHIIJJK',
      contractId: 'CE9A8B7C6D5E4F3G2H1I0JKLMNOPQRSTUVWXYZ9876543',
      ledgerSynced: true
    },
    status: 'active',
    featured: true
  },
  {
    id: 'proj-keo-seima',
    name: 'Keo Seima Wildlife Sanctuary REDD+ Protection',
    slug: 'keo-seima-sanctuary',
    description: 'Keo Seima preserves 292,690 hectares of primary evergreen forest in Eastern Cambodia. The sanctuary is ancestral land to the indigenous Bunong people and shelters 75 threatened species, including the world\'s largest known population of black-shanked douc langurs and Asian elephants. Carbon revenues guarantee Bunong community land titles and 40 ranger patrol units.',
    shortDescription: 'Safeguarding 292,000 hectares of primary Cambodian rainforest and Bunong indigenous territorial sovereignty.',
    location: 'Mondulkiri & Kratie Provinces',
    country: 'Cambodia',
    countryCode: 'KH',
    category: 'forestry',
    standard: 'Verra VCS',
    registryId: 'VCS-1650',
    registryUrl: 'https://registry.verra.org/app/projectDetail/VCS/1650',
    vintage: 2024,
    pricePerTon: 16.20,
    availableCredits: 110000,
    totalCredits: 420000,
    rating: 'AA',
    sdgGoals: [15, 13, 8, 10],
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    developer: {
      name: 'Wildlife Conservation Society Cambodia',
      address: 'GA8923KJHGFRTYU7654321NBVCXZASDFGHKLPOIUYTRE4',
      contactEmail: 'redd@wcs-cambodia.org',
      verified: true
    },
    mrvData: {
      auditor: 'Rainforest Alliance & Aenor',
      methodology: 'VM0015 Avoided Unplanned Deforestation',
      monitoringPeriod: 'Jan 2023 - Dec 2024',
      canopyDensity: '96.1% Intact',
      co2SequesteredAnnual: 1800000,
      satelliteVerified: true,
      bufferPoolPercent: 15.0,
      lastAuditDate: '2026-05-18'
    },
    coordinates: {
      lat: 12.3833,
      lng: 106.8833
    },
    stellarAsset: {
      code: 'GRN-SEIMA',
      issuer: 'GDF1234567890ABCDEFGHJKLMNPQRSTUVWXYZ1234567',
      contractId: 'CF1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1',
      ledgerSynced: true
    },
    status: 'active'
  },
  {
    id: 'proj-nordic-biochar',
    name: 'Nordic Agroforestry Pyrolysis Biochar Network',
    slug: 'nordic-biochar-network',
    description: 'Transforming sustainably harvested forestry residues into high-grade carbon-sequestering biochar across agricultural cooperatives in Southern Sweden. By pyrolyzing organic biomass without oxygen, 50% of the carbon is stabilized permanently and incorporated into regenerative farmland soil, increasing moisture retention and preventing nutrient leaching for centuries.',
    shortDescription: 'Engineered biochar carbon removal permanently stabilizing forestry biomass into regenerative soils.',
    location: 'Småland Region',
    country: 'Sweden',
    countryCode: 'SE',
    category: 'biochar',
    standard: 'Puro.earth',
    registryId: 'CORC-8114',
    registryUrl: 'https://puro.earth/corc-registry/8114',
    vintage: 2025,
    pricePerTon: 74.50,
    availableCredits: 18900,
    totalCredits: 50000,
    rating: 'AAA',
    sdgGoals: [13, 12, 15, 2],
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    developer: {
      name: 'Nordic Carbon Removal AB',
      address: 'GBTYU76543210POIUYTREWQASDFGHJKLMNBVCXZ123456',
      contactEmail: 'contact@nordiccarbon.se',
      verified: true
    },
    mrvData: {
      auditor: 'DNV Business Assurance Sweden',
      methodology: 'Puro Standard Biochar Methodology 2024',
      monitoringPeriod: 'Q1 2024 - Q4 2025',
      co2SequesteredAnnual: 25000,
      satelliteVerified: true,
      bufferPoolPercent: 7.5,
      lastAuditDate: '2026-09-10'
    },
    coordinates: {
      lat: 57.1884,
      lng: 14.0416
    },
    stellarAsset: {
      code: 'GRN-BIOCHAR',
      issuer: 'GAYUIOPLKJHGFDSAZXCVBNM1234567890QWERTYUIOP2',
      contractId: 'CG2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2',
      ledgerSynced: true
    },
    status: 'active'
  },
  {
    id: 'proj-sundarbans-mangroves',
    name: 'Sundarbans Delta Mangrove Conservation & Wildlife',
    slug: 'sundarbans-delta-mangroves',
    description: 'Protecting the largest contiguous mangrove forest on Earth spanning the Ganges-Brahmaputra delta. Sundarbans buffers 4.5 million vulnerable coastal inhabitants against severe cyclones and serves as the ultimate refuge for the Royal Bengal Tiger. Carbon revenue funds tidal embankment bio-engineering and community apiculture (honey collection) co-ops.',
    shortDescription: 'Defending the world\'s largest mangrove delta, protecting tiger sanctuaries, and shielding vulnerable coastal deltas.',
    location: 'Khulna & Barisal Divisions',
    country: 'Bangladesh',
    countryCode: 'BD',
    category: 'blue-carbon',
    standard: 'Gold Standard',
    registryId: 'GS-4921',
    registryUrl: 'https://registry.goldstandard.org/projects/details/4921',
    vintage: 2024,
    pricePerTon: 34.00,
    availableCredits: 45600,
    totalCredits: 160000,
    rating: 'AA+',
    sdgGoals: [14, 13, 15, 11],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    developer: {
      name: 'Delta Climate Resilience Initiative',
      address: 'GDZXCVBNMASDFGHJKLQWERTYUIOP0987654321MNBVC5',
      contactEmail: 'info@deltaclimate.org',
      verified: true
    },
    mrvData: {
      auditor: 'TÜV Rheinland Energy',
      methodology: 'Gold Standard Blue Carbon & Coastal Resilience v2.2',
      monitoringPeriod: 'Jan 2023 - Jun 2025',
      canopyDensity: '94.8% Density',
      co2SequesteredAnnual: 190000,
      satelliteVerified: true,
      bufferPoolPercent: 16.0,
      lastAuditDate: '2026-06-30'
    },
    coordinates: {
      lat: 21.9497,
      lng: 89.1833
    },
    stellarAsset: {
      code: 'GRN-SUNDAR',
      issuer: 'GBLMNBVCXZASDFGHJKLPOIUYTREWQ1234567890POIU8',
      contractId: 'CH3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3',
      ledgerSynced: true
    },
    status: 'active'
  },
  {
    id: 'proj-patagonia-wind',
    name: 'Patagonian Wind & Clean Grid Displacement',
    slug: 'patagonia-wind-power',
    description: 'Harnessing the fierce Southern Hemispheric trade winds in Chubut, Argentina to supply 180 MW of clean renewable electricity into the national interconnected system. The project directly displaces fossil fuel thermal power generation, mitigating over 280,000 tonnes of CO2e annually while catalyzing rural electrical infrastructure.',
    shortDescription: '180 MW high-capacity wind generation displacing fossil generation across South America.',
    location: 'Chubut Province, Patagonia',
    country: 'Argentina',
    countryCode: 'AR',
    category: 'renewable',
    standard: 'Gold Standard',
    registryId: 'GS-3319',
    registryUrl: 'https://registry.goldstandard.org/projects/details/3319',
    vintage: 2024,
    pricePerTon: 12.50,
    availableCredits: 95000,
    totalCredits: 300000,
    rating: 'A+',
    sdgGoals: [7, 13, 9],
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
    developer: {
      name: 'Vientos del Sur Energy SA',
      address: 'GCXZASDFGHJKLQWERTYUIOPMNBVC1234567890LKJHGF9',
      contactEmail: 'esg@vientosdelsur.ar',
      verified: true
    },
    mrvData: {
      auditor: 'AENOR International',
      methodology: 'ACM0002 Grid-Connected Electricity Generation',
      monitoringPeriod: 'Jan 2024 - Dec 2024',
      co2SequesteredAnnual: 280000,
      satelliteVerified: false,
      bufferPoolPercent: 5.0,
      lastAuditDate: '2026-04-12'
    },
    coordinates: {
      lat: -43.2982,
      lng: -65.1023
    },
    stellarAsset: {
      code: 'GRN-WIND',
      issuer: 'GDFRTYUIOPLKJHGFDSAZXCVBNM0987654321QWERTYU3',
      contractId: 'CI4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4',
      ledgerSynced: true
    },
    status: 'active'
  }
];

export const INITIAL_HOLDINGS: UserHolding[] = [
  {
    projectId: 'proj-rimba-raya',
    projectName: 'Rimba Raya Biodiversity Reserve REDD+',
    assetCode: 'GRN-RIMBA',
    vintage: 2024,
    standard: 'Verra VCS',
    amount: 120, // 120 tCO2e
    averageCostPerTon: 18.50,
    currentValueUSD: 2220.00,
    location: 'Central Kalimantan, Borneo',
    country: 'Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=600&q=80'
  },
  {
    projectId: 'proj-orca-dac',
    projectName: 'Orca & Mammoth Direct Air Capture & Mineralization',
    assetCode: 'GRN-ORCA',
    vintage: 2025,
    standard: 'Puro.earth',
    amount: 25, // 25 tCO2e
    averageCostPerTon: 128.00,
    currentValueUSD: 3200.00,
    location: 'Hellisheiði Geothermal Plateau',
    country: 'Iceland',
    imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=600&q=80'
  },
  {
    projectId: 'proj-mikoko-pamoja',
    projectName: 'Mikoko Pamoja Coastal Mangrove Blue Carbon',
    assetCode: 'GRN-MIKOKO',
    vintage: 2024,
    standard: 'Plan Vivo',
    amount: 55, // 55 tCO2e
    averageCostPerTon: 29.75,
    currentValueUSD: 1636.25,
    location: 'Gazi Bay, Kwale County',
    country: 'Kenya',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'
  }
];

export const INITIAL_TRANSACTIONS: StellarTransaction[] = [
  {
    id: 'tx-stellar-001',
    hash: '3f7e9a2b8c4d1e0f6a5b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f',
    type: 'RETIRE',
    projectId: 'proj-rimba-raya',
    projectName: 'Rimba Raya Biodiversity Reserve REDD+',
    amount: 250,
    pricePerTon: 18.50,
    totalValueUSD: 4625.00,
    stellarAssetCode: 'GRN-RIMBA',
    fromAddress: 'GBV4L7QMWX4632KJL4B6DCEV4GZPLJ9R58KNM7P2X4T6Y',
    toAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', // Stellar burn address
    timestamp: '2026-11-10T14:32:00Z',
    ledgerSequence: 54821094,
    status: 'confirmed',
    retirementCertificateId: 'cert-grn-ret-892f'
  },
  {
    id: 'tx-stellar-002',
    hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    type: 'BUY',
    projectId: 'proj-orca-dac',
    projectName: 'Orca & Mammoth Direct Air Capture & Mineralization',
    amount: 25,
    pricePerTon: 128.00,
    totalValueUSD: 3200.00,
    stellarAssetCode: 'GRN-ORCA',
    fromAddress: 'GCKT6Y9WPRQ5A672M87BCDE45GTYUJ98765LKJHGFDSAQ1',
    toAddress: 'GBV4L7QMWX4632KJL4B6DCEV4GZPLJ9R58KNM7P2X4T6Y',
    timestamp: '2026-11-08T09:15:22Z',
    ledgerSequence: 54817450,
    status: 'confirmed'
  },
  {
    id: 'tx-stellar-003',
    hash: 'b8c9d0e1f2a34567890123456789abcdef0123456789abcdef0123456789abcdef',
    type: 'BUY',
    projectId: 'proj-mikoko-pamoja',
    projectName: 'Mikoko Pamoja Coastal Mangrove Blue Carbon',
    amount: 55,
    pricePerTon: 29.75,
    totalValueUSD: 1636.25,
    stellarAssetCode: 'GRN-MIKOKO',
    fromAddress: 'GDPT78MNBVCXZASDFGHJKLPOIUYTREWQ1234567890AB',
    toAddress: 'GBV4L7QMWX4632KJL4B6DCEV4GZPLJ9R58KNM7P2X4T6Y',
    timestamp: '2026-11-05T18:44:10Z',
    ledgerSequence: 54809210,
    status: 'confirmed'
  },
  {
    id: 'tx-stellar-004',
    hash: 'c9d0e1f2a3b4567890123456789abcdef0123456789abcdef0123456789abcdef1',
    type: 'MINT',
    projectId: 'proj-nordic-biochar',
    projectName: 'Nordic Agroforestry Pyrolysis Biochar Network',
    amount: 50000,
    pricePerTon: 74.50,
    totalValueUSD: 3725000.00,
    stellarAssetCode: 'GRN-BIOCHAR',
    fromAddress: 'GAYUIOPLKJHGFDSAZXCVBNM1234567890QWERTYUIOP2',
    toAddress: 'GBTYU76543210POIUYTREWQASDFGHJKLMNBVCXZ123456',
    timestamp: '2026-10-28T11:05:00Z',
    ledgerSequence: 54760124,
    status: 'confirmed'
  },
  {
    id: 'tx-stellar-005',
    hash: 'd0e1f2a3b4c567890123456789abcdef0123456789abcdef0123456789abcdef2',
    type: 'BUY',
    projectId: 'proj-rimba-raya',
    projectName: 'Rimba Raya Biodiversity Reserve REDD+',
    amount: 120,
    pricePerTon: 18.50,
    totalValueUSD: 2220.00,
    stellarAssetCode: 'GRN-RIMBA',
    fromAddress: 'GDQ2XR4MVH73K527M67POGW7M4LQ5XJ2T7O7KPYQZ2N7C9K',
    toAddress: 'GBV4L7QMWX4632KJL4B6DCEV4GZPLJ9R58KNM7P2X4T6Y',
    timestamp: '2026-10-20T16:20:45Z',
    ledgerSequence: 54710400,
    status: 'confirmed'
  }
];

export const INITIAL_CERTIFICATES: RetirementCertificate[] = [
  {
    id: 'cert-grn-ret-892f',
    certificateNumber: 'GRN-RET-2026-X892F',
    beneficiaryName: 'Acme Enterprise Global Solutions Inc.',
    beneficiaryAddress: 'GBV4L7QMWX4632KJL4B6DCEV4GZPLJ9R58KNM7P2X4T6Y',
    reason: 'Corporate Scope 1 & Scope 2 Operational Carbon Neutrality Q3 2026',
    projectId: 'proj-rimba-raya',
    projectName: 'Rimba Raya Biodiversity Reserve REDD+',
    projectCountry: 'Indonesia',
    standard: 'Verra VCS',
    registryId: 'VCS-844',
    vintage: 2024,
    amountTonnes: 250,
    timestamp: '2026-11-10T14:32:00Z',
    txHash: '3f7e9a2b8c4d1e0f6a5b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f',
    ledgerSequence: 54821094,
    contractId: 'CB7Y9M2XQW876543210POIUYTREWQASDFGHJKLMNBVCXZ1',
    qrData: 'https://greentoken.stellar/verify/GRN-RET-2026-X892F?tx=3f7e9a2b8c4d1e0f6a5b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f',
    issuerName: 'GreenToken Verified Foundation & Stellar Validator Node #12',
    signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
];

export const INITIAL_VERIFIERS: Verifier[] = [
  {
    id: 'ver-verra',
    name: 'Verra VCS (Verified Carbon Standard)',
    code: 'VCS-GLOBAL',
    registryType: 'Global AFOLU & Industrial Standards',
    stellarSigningKey: 'GA7R4KMNBV987654321POIUYTREWQASDFGHJKLMNBVCXZ1',
    accreditedSince: '2022-03-15',
    status: 'active',
    auditsCompleted: 142,
    contactEmail: 'stellar-gateway@verra.org'
  },
  {
    id: 'ver-gold-standard',
    name: 'Gold Standard for the Global Goals',
    code: 'GS-GENEVA',
    registryType: 'Renewable, Community & Water Benefits',
    stellarSigningKey: 'GB8S5LMNCW098765432QWERTYUIOPASDFGHJKLMNBVCXZ2',
    accreditedSince: '2022-06-10',
    status: 'active',
    auditsCompleted: 98,
    contactEmail: 'registry@goldstandard.org'
  },
  {
    id: 'ver-puro-earth',
    name: 'Puro.earth Carbon Removal Registry',
    code: 'PURO-HELSINKI',
    registryType: 'Engineered High-Permanence CORCs (DAC, Biochar)',
    stellarSigningKey: 'GC9T6MNODX109876543ZXCVBNMASDFGHJKLPOIUYTREWQ3',
    accreditedSince: '2023-01-20',
    status: 'active',
    auditsCompleted: 67,
    contactEmail: 'mrv-node@puro.earth'
  },
  {
    id: 'ver-dnv',
    name: 'DNV GL Business Assurance VVB',
    code: 'DNV-OSLO',
    registryType: 'Accredited Independent Validation & Verification Body',
    stellarSigningKey: 'GD0U7NOPEY210987654LKJHGFDSAZXCVBNMPOIUYTREWQ4',
    accreditedSince: '2021-11-04',
    status: 'active',
    auditsCompleted: 215,
    contactEmail: 'climate-vvb@dnv.com'
  },
  {
    id: 'ver-sgs',
    name: 'SGS United Kingdom Environmental Services',
    code: 'SGS-LONDON',
    registryType: 'Independent Satellite & Ground Truth VVB',
    stellarSigningKey: 'GE1V8OPQFZ321098765POIUYTREWQASDFGHJKLMNBVCXZ5',
    accreditedSince: '2022-08-19',
    status: 'active',
    auditsCompleted: 184,
    contactEmail: 'environmental.audit@sgs.com'
  }
];

export const INITIAL_SUBMISSIONS: ProjectSubmission[] = [
  {
    id: 'sub-001',
    name: 'Amazon Tapajós Indigenous Bio-Corridor Protection',
    developerName: 'Munduruku Agro-Forestry Alliance',
    developerAddress: 'GBMUNDURUKU77665544332211AABBCCDDEEFFGGHHIIJJKK',
    country: 'Brazil',
    biome: 'Amazonian Humid Evergreen Rainforest',
    coordinates: {
      lat: -4.2694,
      lng: -55.9908
    },
    standard: 'Verra VCS',
    methodologyId: 'VM0007 Tropical Forest Conservation v1.7',
    estimatedAnnualCredits: 420000,
    vintageStart: 2025,
    vintageEnd: 2035,
    pricePerTon: 21.00,
    category: 'forestry',
    documents: [
      { name: 'Tapajos_Project_Design_Document_v2.pdf', size: '14.2 MB', type: 'application/pdf', uploadedAt: '2026-11-01' },
      { name: 'GIS_Boundary_Shapefiles_Cadastral.zip', size: '28.6 MB', type: 'application/zip', uploadedAt: '2026-11-01' },
      { name: 'Indigenous_FPIC_Consent_Charter.pdf', size: '4.8 MB', type: 'application/pdf', uploadedAt: '2026-11-02' }
    ],
    status: 'in_review',
    submittedAt: '2026-11-02T10:14:00Z',
    assignedVerifier: 'ver-verra'
  },
  {
    id: 'sub-002',
    name: 'Tasmanian Giant Kelp Afforestation & Ocean Sink',
    developerName: 'Southern Ocean Restoration Ltd',
    developerAddress: 'GCTASMANIA88776655443322AABBCCDDEEFFGGHHIIJJKKL',
    country: 'Australia',
    biome: 'Temperate Sub-Antarctic Marine Kelp Forest',
    coordinates: {
      lat: -43.1258,
      lng: 147.9142
    },
    standard: 'Gold Standard',
    methodologyId: 'GS-OCEAN-2024 Marine Macroalgae Sequestration',
    estimatedAnnualCredits: 150000,
    vintageStart: 2025,
    vintageEnd: 2030,
    pricePerTon: 48.00,
    category: 'blue-carbon',
    documents: [
      { name: 'Tasman_Kelp_MRV_Framework.pdf', size: '9.4 MB', type: 'application/pdf', uploadedAt: '2026-11-08' },
      { name: 'CSIRO_Ocean_Chemistry_Baseline_Study.pdf', size: '18.1 MB', type: 'application/pdf', uploadedAt: '2026-11-08' }
    ],
    status: 'pending',
    submittedAt: '2026-11-08T15:30:00Z'
  }
];

