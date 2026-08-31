/**
 * Keyword clustering across 15+ high-conviction startup sectors.
 */

export const CLUSTERS = [
  {
    id: 'bfsi-ai-compliance',
    name: 'BFSI AI Regulatory Compliance Audits',
    vertical: 'BFSI',
    industry: 'BFSI / RegTech',
    keywords: {
      compliance: 3,
      rbi: 3,
      'fair practice': 4,
      dpdp: 3,
      audit: 2,
      circular: 2,
      'recovery agent': 3,
      regulator: 2,
      consent: 2,
      disclosure: 2,
      'lending app': 3,
      kyc: 2,
    },
  },
  {
    id: 'bfsi-fraud-prevention',
    name: 'Real-time UPI Merchant Fraud Prevention',
    vertical: 'BFSI',
    industry: 'BFSI / Payments',
    keywords: {
      upi: 4,
      fraud: 4,
      mule: 4,
      freeze: 3,
      frozen: 3,
      chargeback: 3,
      npci: 3,
      settlement: 2,
      'cyber cell': 3,
      scam: 2,
      merchant: 2,
      'device fingerprint': 3,
      payment: 1,
    },
  },
  {
    id: 'it-code-migration',
    name: 'AI Legacy Code Refactoring and Migration',
    vertical: 'IT',
    industry: 'IT / Software Engineering',
    keywords: {
      legacy: 4,
      refactor: 4,
      migration: 3,
      modernise: 3,
      modernize: 3,
      cobol: 4,
      'java 8': 4,
      monolith: 3,
      ast: 3,
      'technical debt': 3,
      rewrite: 2,
      transpile: 3,
    },
  },
  {
    id: 'it-llm-observability',
    name: 'LLM Observability and Token Caching Gateway',
    vertical: 'IT',
    industry: 'IT / DevOps and AI Infrastructure',
    keywords: {
      llm: 4,
      observability: 4,
      'prompt injection': 4,
      token: 2,
      proxy: 3,
      tracing: 3,
      agent: 2,
      inference: 3,
      'cost limit': 4,
      latency: 2,
      guardrail: 3,
      openai: 2,
      caching: 2,
    },
  },
  {
    id: 'it-agentic-guardrails',
    name: 'Agentic Policy Layer & Runtime Guardrails',
    vertical: 'IT',
    industry: 'IT / AI Security',
    keywords: {
      agent: 3,
      guardrail: 4,
      mcp: 4,
      sandbox: 3,
      spend: 3,
      policy: 3,
      injection: 3,
      loop: 2,
    },
  },
  {
    id: 'bfsi-gst-reconciliation',
    name: 'GST Invoice Matching and Tax Credit Recovery',
    vertical: 'BFSI',
    industry: 'BFSI / TaxTech',
    keywords: {
      gst: 4,
      gstr: 4,
      invoice: 3,
      'input tax credit': 4,
      itc: 3,
      reconciliation: 4,
      cbic: 3,
      msme: 2,
      'working capital': 2,
      tax: 2,
      ledger: 2,
    },
  },
  {
    id: 'bfsi-msme-credit-scoring',
    name: 'MSME Credit Scoring from GST and UPI Data',
    vertical: 'BFSI',
    industry: 'BFSI / Lending',
    keywords: {
      lending: 3,
      underwriting: 4,
      'account aggregator': 4,
      credit: 3,
      nbfc: 3,
      cashflow: 3,
      msme: 3,
      score: 2,
    },
  },
  {
    id: 'health-abdm-emr-bridge',
    name: 'ABDM-Compliant Unified Clinic EMR & FHIR Exchange',
    vertical: 'HEALTHCARE',
    industry: 'HealthTech / ABDM',
    keywords: {
      abdm: 4,
      abha: 4,
      emr: 3,
      clinic: 3,
      prescription: 3,
      nha: 4,
      fhir: 4,
      hospital: 2,
      doctor: 2,
    },
  },
  {
    id: 'agri-fpo-credit-fintech',
    name: 'FPO Direct Market Linkage & Warehouse Receipt Financing',
    vertical: 'AGRITECH',
    industry: 'AgriTech / FinTech',
    keywords: {
      fpo: 4,
      agri: 3,
      mandi: 4,
      warehouse: 3,
      enam: 4,
      farmer: 3,
      crop: 2,
      nabard: 3,
    },
  },
  {
    id: 'logistics-ondc-dispatch',
    name: 'ONDC Seller Dispatch & Hyperlocal Multi-Fleet Orchestrator',
    vertical: 'LOGISTICS',
    industry: 'Logistics / E-commerce',
    keywords: {
      ondc: 4,
      beckn: 4,
      dispatch: 3,
      hyperlocal: 3,
      delivery: 3,
      fleet: 3,
      rider: 2,
      logistics: 2,
    },
  },
  {
    id: 'legal-ecourts-litigation-rag',
    name: 'e-Courts Case Law Precedent & Drafting Assistant',
    vertical: 'LEGALTECH',
    industry: 'LegalTech',
    keywords: {
      law: 3,
      court: 4,
      advocate: 3,
      litigation: 4,
      precedent: 4,
      judgment: 3,
      bns: 3,
      ipc: 3,
      legal: 2,
    },
  },
  {
    id: 'saas-ca-firm-workflow',
    name: 'AI Audit & Tax Workpaper Assistant for Indian CAs',
    vertical: 'SAAS',
    industry: 'FinTech / SaaS',
    keywords: {
      ca: 4,
      audit: 4,
      tax: 3,
      '26as': 4,
      ais: 4,
      tds: 4,
      workpaper: 3,
      chartered: 3,
      tally: 2,
    },
  },
  {
    id: 'logistics-ev-fleet-bms',
    name: 'EV Commercial Fleet Battery Telematics & BMS Analytics',
    vertical: 'CLEANTECH',
    industry: 'Logistics / CleanTech',
    keywords: {
      ev: 4,
      battery: 4,
      bms: 4,
      telematics: 3,
      fleet: 3,
      degradation: 3,
      charging: 2,
      thermal: 2,
    },
  },
  {
    id: 'retail-quickcommerce-inventory',
    name: 'Dark Store Hyperlocal Demand & Stockout Predictor',
    vertical: 'SAAS',
    industry: 'RetailTech / Supply Chain',
    keywords: {
      'dark store': 4,
      'quick commerce': 4,
      stockout: 4,
      inventory: 3,
      blinkit: 3,
      zepto: 3,
      hyperlocal: 2,
    },
  },
  {
    id: 'saas-vernacular-hr-payroll',
    name: 'Blue-Collar Vernacular Attendance & Labor Law Payroll',
    vertical: 'SAAS',
    industry: 'HRTech / Workforce',
    keywords: {
      'blue collar': 4,
      labor: 4,
      attendance: 3,
      payroll: 3,
      pf: 4,
      esi: 4,
      contractor: 3,
      wage: 3,
      muster: 3,
    },
  },
  {
    id: 'bfsi-cross-border-settlement',
    name: 'Cross-Border B2B Exim Payment & Remittance Gateway',
    vertical: 'BFSI',
    industry: 'BFSI / Cross-Border Payments',
    keywords: {
      swift: 4,
      remittance: 4,
      fema: 4,
      firc: 4,
      ebrc: 4,
      exporter: 3,
      fx: 3,
      currency: 2,
    },
  },
  {
    id: 'it-dpdp-compliance-vault',
    name: 'DPDP Act Consent Manager & Right-to-Forget Vault',
    vertical: 'IT',
    industry: 'IT / PrivacyTech',
    keywords: {
      dpdp: 4,
      privacy: 4,
      consent: 4,
      meity: 4,
      pii: 3,
      breach: 3,
      dpo: 3,
    },
  },
  {
    id: 'it-cloud-finops-india',
    name: 'Cloud FinOps & GPU Cluster Cost Optimization',
    vertical: 'IT',
    industry: 'IT / Cloud Infrastructure',
    keywords: {
      finops: 4,
      gpu: 4,
      spot: 4,
      kubernetes: 3,
      aws: 3,
      egress: 3,
      burn: 2,
    },
  },
  {
    id: 'health-diagnostic-teleradiology',
    name: 'Edge AI Teleradiology & X-Ray Screening for Tier-2/3 Labs',
    vertical: 'HEALTHCARE',
    industry: 'HealthTech / Medical Imaging',
    keywords: {
      radiology: 4,
      xray: 4,
      dicom: 4,
      radiologist: 4,
      tuberculosis: 3,
      ct: 3,
      cdsco: 3,
    },
  },
  {
    id: 'agri-precision-iot-irrigation',
    name: 'Solar-Powered Precision Drip Irrigation & Soil AI',
    vertical: 'AGRITECH',
    industry: 'AgriTech / Precision IoT',
    keywords: {
      irrigation: 4,
      drip: 4,
      lorawan: 4,
      soil: 4,
      moisture: 3,
      groundwater: 3,
      solar: 2,
    },
  },
  // --- Expanded coverage: EdTech, ClimateTech, ECommerce, Insurance, MSME security ---
  {
    id: 'edtech-ai-proctoring',
    name: 'AI Proctoring & Vernacular Skill Assessments for Volume Hiring',
    vertical: 'EdTech',
    industry: 'EdTech / Hiring Assessment',
    keywords: {
      proctoring: 4,
      assessment: 3,
      assessments: 3,
      exam: 3,
      cheating: 4,
      'campus hiring': 4,
      placement: 3,
      'skill test': 3,
      invigilator: 4,
      'hiring test': 3,
      'aptitude test': 2,
      certification: 2,
    },
  },
  {
    id: 'edtech-vernacular-tutoring',
    name: 'Vernacular AI Tutors for Government School Syllabus',
    vertical: 'EdTech',
    industry: 'EdTech / K-12 Vernacular Learning',
    keywords: {
      tutor: 4,
      tuition: 3,
      vernacular: 4,
      'medium of instruction': 3,
      ncert: 4,
      'state board': 4,
      'govt school': 4,
      hinglish: 3,
      bhasha: 3,
      'regional language': 3,
      homework: 2,
      syllabus: 3,
    },
  },
  {
    id: 'climate-carbon-mrv-msme',
    name: 'Carbon MRV & ESG Reporting Automation for MSME Exporters',
    vertical: 'ClimateTech',
    industry: 'ClimateTech / Carbon MRV',
    keywords: {
      carbon: 4,
      esg: 4,
      cbam: 5,
      'scope 1': 4,
      'scope 2': 4,
      emissions: 4,
      'carbon credit': 4,
      sustainability: 3,
      exporter: 2,
      'green energy': 2,
      igbc: 3,
      bureau: 2,
    },
  },
  {
    id: 'climate-rooftop-solar-underwriting',
    name: 'Rooftop Solar Underwriting & Asset Performance Monitoring',
    vertical: 'ClimateTech',
    industry: 'ClimateTech / Distributed Energy',
    keywords: {
      rooftop: 4,
      solar: 4,
      pv: 3,
      inverter: 3,
      'net metering': 4,
      discom: 3,
      'plant performance': 3,
      'generation loss': 3,
      cleantech: 2,
      kwp: 3,
      subsidy: 2,
      'renewable': 2,
    },
  },
  {
    id: 'ecommerce-ondc-cataloguing',
    name: 'AI Cataloguing & Vernacular Listings for ONDC Sellers',
    vertical: 'ECommerce',
    industry: 'ECommerce / Seller Enablement',
    keywords: {
      ondc: 5,
      catalogue: 4,
      cataloguing: 4,
      listing: 3,
      seller: 3,
      d2c: 3,
      storefront: 3,
      'product image': 3,
      glcode: 3,
      marketplace: 3,
      kirana: 3,
      'quick commerce': 3,
    },
  },
  {
    id: 'health-mental-health-triage',
    name: 'Vernacular Mental Health Triage for Tier-2/3 India',
    vertical: 'HealthTech',
    industry: 'HealthTech / Mental Health',
    keywords: {
      'mental health': 4,
      therapy: 3,
      counsellor: 4,
      psychologist: 3,
      depression: 3,
      anxiety: 3,
      burnout: 3,
      'student suicide': 4,
      teletherapy: 4,
      wellbeing: 2,
      stigma: 3,
      helpline: 3,
    },
  },
  {
    id: 'logistics-coldchain-telemetry',
    name: 'Cold Chain Telemetry-as-a-Service for Pharma & Agri',
    vertical: 'Logistics',
    industry: 'Logistics / Cold Chain IoT',
    keywords: {
      'cold chain': 5,
      reefer: 4,
      'temperature excursion': 4,
      vaccine: 3,
      spoilage: 4,
      coldstorage: 4,
      'cold storage': 4,
      iot: 2,
      telemetry: 3,
      'last mile': 2,
      perishable: 4,
      gxp: 3,
    },
  },
  {
    id: 'bfsi-insurance-claims-genai',
    name: 'GenAI Claims Adjudication for Health & Motor Insurance',
    vertical: 'BFSI',
    industry: 'BFSI / InsurTech',
    keywords: {
      claim: 4,
      claims: 4,
      adjudication: 4,
      insurer: 3,
      tpa: 4,
      irdai: 4,
      policyholder: 3,
      cashless: 3,
      underwriting: 2,
      reimbursement: 3,
      'motor insurance': 4,
    },
  },
  {
    id: 'it-msme-soc-cybersecurity',
    name: 'Managed SOC & Cyber Compliance for Indian MSMEs',
    vertical: 'IT',
    industry: 'IT / CyberSecurity',
    keywords: {
      soc: 3,
      'managed security': 4,
      ransomware: 4,
      cert: 2,
      'cert-in': 5,
      endpoint: 3,
      phishing: 3,
      msme: 3,
      'cyber insurance': 3,
      iso27001: 4,
      'iso 27001': 4,
      breach: 3,
    },
  },
  {
    id: 'agri-drone-spray-network',
    name: 'Drone-as-a-Service Network for Precision Farming',
    vertical: 'AgriTech',
    industry: 'AgriTech / Drone Services',
    keywords: {
      drone: 5,
      spraying: 4,
      'kisan drone': 4,
      dgca: 4,
      pesticide: 3,
      'drone pilot': 4,
      agri: 1,
      'nano urea': 3,
      'crop health': 3,
      multispectral: 3,
      'custom hiring': 3,
      fungicide: 2,
    },
  },
];

const CATCH_ALL = {
  id: 'emerging-unclustered',
  name: 'Emerging Unclustered Signals',
  vertical: 'IT',
  industry: 'Cross-sector / Emerging',
  keywords: {},
};

const MIN_SCORE = 3;

function scoreAgainst(text, keywords) {
  let total = 0;
  for (const [keyword, weight] of Object.entries(keywords)) {
    if (text.includes(keyword)) total += weight;
  }
  return total;
}

function sortBySalience(signals) {
  return (signals || []).sort(
    (a, b) => (b.matchScore || 0) * 10 + (b.engagement || 0) - ((a.matchScore || 0) * 10 + (a.engagement || 0))
  );
}

export function clusterSignals(signals, { keepUnclustered = true } = {}) {
  const buckets = new Map();
  for (const cluster of CLUSTERS) buckets.set(cluster.id, []);
  const unclustered = [];

  for (const signal of signals) {
    const text = String(signal.text || '').toLowerCase();
    if (text.length < 15) continue;

    let best = null;
    let bestScore = 0;

    for (const cluster of CLUSTERS) {
      const score = scoreAgainst(text, cluster.keywords);
      if (score > bestScore) {
        bestScore = score;
        best = cluster;
      }
    }

    if (best && bestScore >= MIN_SCORE) {
      buckets.get(best.id).push({ ...signal, clusterId: best.id, matchScore: bestScore });
    } else {
      unclustered.push({ ...signal, clusterId: CATCH_ALL.id, matchScore: bestScore });
    }
  }

  const result = CLUSTERS.map((cluster) => ({
    ...cluster,
    signals: sortBySalience(buckets.get(cluster.id)),
  })).filter((cluster) => cluster.signals.length > 0);

  if (keepUnclustered && unclustered.length >= 4) {
    result.push({ ...CATCH_ALL, signals: sortBySalience(unclustered).slice(0, 12) });
  }

  return result;
}

export function summarizeClusters(clusters) {
  return (clusters || []).map((c) => ({
    id: c.id,
    name: c.name,
    vertical: c.vertical,
    signalCount: c.signals?.length || 0,
  }));
}

export default clusterSignals;
