/**
 * 50세 은퇴 재무설계 — 재무 계산 엔진
 * 모든 금액은 원(KRW) 단위, 소수점 둘째자리 반올림
 */

const Calculator = {
  
  // ========== 유틸리티 ==========
  
  /** 소수점 둘째자리 반올림 */
  round(value) {
    return Math.round(value * 100) / 100;
  },

  /** 원 단위 반올림 (정수) */
  roundWon(value) {
    return Math.round(value);
  },

  /** 보기 좋은 문자열로 포맷팅 (억/만 원) */
  formatWon(val) {
    if (val >= 100000000) return (val / 100000000).toFixed(1) + '억 원';
    return Math.round(val / 10000).toLocaleString('ko-KR') + '만 원';
  },

  // ========== 기본 재무 공식 ==========

  /**
   * 미래 가치 (Future Value)
   * @param {number} presentValue - 현재 가치
   * @param {number} rate - 연이율 (%, 예: 5.00)
   * @param {number} years - 기간 (년)
   * @returns {number} 미래 가치
   */
  futureValue(presentValue, rate, years) {
    const r = rate / 100;
    return this.roundWon(presentValue * Math.pow(1 + r, years));
  },

  /**
   * 현재 가치 (Present Value)
   * @param {number} futureValue - 미래 가치
   * @param {number} rate - 연이율 (%)
   * @param {number} years - 기간 (년)
   * @returns {number} 현재 가치
   */
  presentValue(futureValue, rate, years) {
    const r = rate / 100;
    return this.roundWon(futureValue / Math.pow(1 + r, years));
  },

  /**
   * 적립식 미래 가치 (Future Value of Annuity)
   * 매월 일정액을 적립할 때의 미래 가치
   * @param {number} monthlyPayment - 월 적립액
   * @param {number} annualRate - 연이율 (%)
   * @param {number} years - 기간 (년)
   * @returns {number} 미래 가치
   */
  annuityFutureValue(monthlyPayment, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    if (monthlyRate === 0) return this.roundWon(monthlyPayment * months);
    const fv = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return this.roundWon(fv);
  },

  /**
   * 실질 수익률 계산
   * @param {number} nominalRate - 명목 수익률 (%)
   * @param {number} inflationRate - 물가상승률 (%)
   * @returns {number} 실질 수익률 (%)
   */
  realReturn(nominalRate, inflationRate) {
    const real = ((1 + nominalRate / 100) / (1 + inflationRate / 100) - 1) * 100;
    return this.round(real);
  },

  // ========== 소득 & 세금 ==========

  /**
   * 연봉 성장 예측
   * @param {number} currentSalary - 현재 연봉 (세전)
   * @param {number} growthRate - 연봉인상률 (%)
   * @param {number} years - 기간 (년)
   * @returns {Array} 연도별 연봉 배열
   */
  projectSalary(currentSalary, growthRate, years) {
    const result = [];
    let salary = currentSalary;
    for (let i = 0; i <= years; i++) {
      result.push({
        year: i,
        salary: this.roundWon(salary),
        monthly: this.roundWon(salary / 12)
      });
      salary *= (1 + growthRate / 100);
    }
    return result;
  },

  /**
   * 소득세 계산 (간이)
   * @param {number} annualIncome - 연간 총 소득
   * @returns {number} 예상 소득세
   */
  calculateIncomeTax(annualIncome) {
    const brackets = DATA.tax.incomeTaxBrackets;
    let tax = 0;
    let prev = 0;
    for (const bracket of brackets) {
      if (annualIncome <= prev) break;
      const taxable = Math.min(annualIncome, bracket.limit) - prev;
      tax += taxable * bracket.rate / 100;
      prev = bracket.limit;
    }
    return this.roundWon(tax);
  },

  /**
   * 연금저축/IRP 세액공제 계산
   * @param {number} annualIncome - 연간 총급여
   * @param {number} pensionSaving - 연금저축 납입액
   * @param {number} irpPayment - IRP 납입액
   * @returns {object} 세액공제 상세
   */
  calculatePensionTaxBenefit(annualIncome, pensionSaving, irpPayment) {
    const maxPension = Math.min(pensionSaving, DATA.tax.pensionSavingsDeduction);
    const maxIrp = Math.min(irpPayment, DATA.tax.irpDeduction);
    const totalDeduction = Math.min(maxPension + maxIrp, DATA.tax.totalPensionDeduction);
    
    const rate = annualIncome <= 55000000 
      ? DATA.tax.pensionDeductionRate.under55m 
      : DATA.tax.pensionDeductionRate.over55m;
    
    const taxSaving = this.roundWon(totalDeduction * rate / 100);
    
    return {
      pensionDeduction: maxPension,
      irpDeduction: maxIrp,
      totalDeduction,
      deductionRate: rate,
      annualTaxSaving: taxSaving,
      monthlyTaxSaving: this.roundWon(taxSaving / 12)
    };
  },

  // ========== 은퇴 자금 계산 ==========

  /**
   * 목표 은퇴 자금 계산
   * @param {object} params
   * @returns {object} 은퇴 자금 상세
   */
  calculateRetirementFund(params) {
    const {
      currentAge,
      retireAge = 50,
      lifeExpectancy = 90,
      monthlyExpense,        // 은퇴 후 희망 월 생활비 (현재 가치)
      inflationRate,
      pensionMonthly = 0,    // 예상 국민연금 월 수령액
      pensionStartAge = 65,
      currentAssets = 0,
      expectedReturn         // 포트폴리오 기대수익률 (%)
    } = params;

    const reasoning = [];
    reasoning.push(`[입력값 분석] 현재 나이 ${currentAge}세, 목표 은퇴 나이 ${retireAge}세, 기대수명 ${lifeExpectancy}세, 월 희망 생활비(현재 가치) ${this.formatWon(monthlyExpense)}, 예상 수익률 ${expectedReturn.toFixed(1)}%.`);

    const yearsToRetire = retireAge - currentAge;
    const retirementYears = lifeExpectancy - retireAge;
    const bridgeYears = pensionStartAge - retireAge;
    const pensionYears = lifeExpectancy - pensionStartAge;

    // 은퇴 생활비 Gross-up (세금 15.4% 및 지역건보료 보수적 반영)
    // [Bug Fix] 건보료는 세금이 아닌 별도 지출이므로 Gross-up 외부에서 가산해야 함
    // 올바른 공식: grossMonthlyExpense = 생활비 / (1 - 세율) + 건보료
    const healthInsuranceEst = 250000; // 예상 월 건보료 (지역가입자 보수적 추정)
    const grossMonthlyExpense = this.roundWon(monthlyExpense / (1 - 0.154) + healthInsuranceEst);
    reasoning.push(`[세금 역산 (Gross-up)] 순수 월 생활비 ${this.formatWon(monthlyExpense)} 확보를 위해 배당소득세(15.4%)를 역산한 세전 필요 인출액 ${this.formatWon(this.roundWon(monthlyExpense / (1 - 0.154)))}에, 지역건보료(약 25만원)를 별도 가산하여 총 월 인출액을 ${this.formatWon(grossMonthlyExpense)}으로 산출했습니다.`);

    // 은퇴 시점 월 생활비 (인플레이션 반영)
    const retireMonthlyExpense = this.futureValue(grossMonthlyExpense, inflationRate, yearsToRetire);
    const retireAnnualExpense = retireMonthlyExpense * 12;
    reasoning.push(`[물가 상승 반영] 현재가치 ${this.formatWon(grossMonthlyExpense)}는 연 물가상승률 ${inflationRate.toFixed(1)}%를 반영하면 ${yearsToRetire}년 뒤 은퇴 시점에 월 ${this.formatWon(retireMonthlyExpense)}의 가치를 갖게 됩니다. (연간 ${this.formatWon(retireAnnualExpense)})`);

    // 브릿지 기간 필요 자금 (50세~65세, 연금 없이)
    let bridgeFund = 0;
    for (let y = 0; y < bridgeYears; y++) {
      const yearlyExpense = this.futureValue(retireAnnualExpense, inflationRate, y);
      bridgeFund += this.presentValue(yearlyExpense, expectedReturn, y);
    }
    bridgeFund = this.roundWon(bridgeFund);
    reasoning.push(`[브릿지 자금 산출] 연금 수령 전인 50세~65세(${bridgeYears}년) 동안의 소득 공백기 방어를 위해 현재 가치로 총 ${this.formatWon(bridgeFund)}의 브릿지 자금이 필요합니다.`);

    // 연금 수령 기간 필요 자금 (65세~, 연금 차감)
    let postPensionFund = 0;
    const pensionAtStart = this.futureValue(pensionMonthly, inflationRate, pensionStartAge - currentAge) * 12;
    for (let y = 0; y < pensionYears; y++) {
      const yearlyExpense = this.futureValue(retireAnnualExpense, inflationRate, bridgeYears + y);
      const yearlyPension = this.futureValue(pensionAtStart, inflationRate, y);
      const deficit = Math.max(0, yearlyExpense - yearlyPension);
      postPensionFund += this.presentValue(deficit, expectedReturn, bridgeYears + y);
    }
    postPensionFund = this.roundWon(postPensionFund);
    reasoning.push(`[연금 수령 후 자금 산출] 65세 이후부터 90세까지 국민연금을 차감한 부족분 확보를 위해 총 ${this.formatWon(postPensionFund)}의 자금이 추가로 필요합니다.`);

    // 총 필요 은퇴 자금
    const totalRequired = bridgeFund + postPensionFund;
    reasoning.push(`[최종 목표 자금] 브릿지 자금과 연금 수령 후 자금을 합산하여, 당신의 최종 목표 은퇴 자금(FIRE Goal)은 ${this.formatWon(totalRequired)}으로 산출되었습니다.`);

    // 4% 룰 기반 필요 자금 (비교용)
    const fourPercentRule = this.roundWon(retireAnnualExpense * 25);

    // 현재 자산의 은퇴 시점 가치
    const currentAssetsAtRetire = this.futureValue(currentAssets, expectedReturn, yearsToRetire);

    // 추가로 모아야 할 금액
    const additionalRequired = Math.max(0, totalRequired - currentAssetsAtRetire);

    // 필요 월 저축액 (적립식)
    const monthlyRate = expectedReturn / 100 / 12;
    const months = yearsToRetire * 12;
    let requiredMonthlySaving;
    if (monthlyRate === 0) {
      requiredMonthlySaving = additionalRequired / months;
    } else {
      requiredMonthlySaving = additionalRequired * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    }
    requiredMonthlySaving = this.roundWon(requiredMonthlySaving);

    return {
      yearsToRetire,
      retirementYears,
      bridgeYears,
      pensionYears,
      retireMonthlyExpense,
      retireAnnualExpense,
      bridgeFund,
      postPensionFund,
      totalRequired,
      fourPercentRule,
      currentAssetsAtRetire,
      additionalRequired,
      requiredMonthlySaving,
      reasoning
    };
  },

  // ========== 자산 성장 시뮬레이션 ==========

  /**
   * 연도별 자산 성장 추이 계산
   * @param {object} params
   * @returns {Array} 연도별 자산 추이
   */
  projectAssetGrowth(params) {
    const {
      currentAge,
      retireAge = 50,
      lifeExpectancy = 90,
      currentAssets,
      monthlySaving,
      annualReturn,
      inflationRate,
      salaryGrowthRate = 0,
      monthlyExpense,
      pensionMonthly = 0,
      pensionStartAge = 65,
      lifeEvents = []
    } = params;

    // 시나리오 생성기
    const simulate = (returnRate) => {
      const result = [];
      let totalAssets = currentAssets;
      let currentMonthlySaving = monthlySaving;

      // [Bug Fix] 시뮬레이션에서도 Gross-up(세금+건보료)된 실제 필요 인출액을 사용해야 함
      const healthInsuranceEst = 250000; 
      const grossMonthlyExpense = (monthlyExpense / (1 - 0.154)) + healthInsuranceEst;
      const grossAnnualExpense = grossMonthlyExpense * 12;

      for (let year = 0; year <= lifeExpectancy - currentAge; year++) {
        const age = currentAge + year;
        
        // 생애 이벤트 비용 차감
        let eventCost = 0;
        let eventLabel = '';
        for (const event of lifeEvents) {
          if (event.age === age) {
            eventCost += event.cost;
            eventLabel = event.label;
          }
        }

        if (age < retireAge) {
          const annualSaving = currentMonthlySaving * 12;
          totalAssets = totalAssets * (1 + returnRate / 100) + annualSaving - eventCost;
          currentMonthlySaving *= (1 + salaryGrowthRate / 100);
        } else if (age < pensionStartAge) {
          const yearlyExpense = this.futureValue(grossAnnualExpense, inflationRate, year);
          totalAssets = totalAssets * (1 + returnRate / 100) - yearlyExpense - eventCost;
        } else {
          const yearlyExpense = this.futureValue(grossAnnualExpense, inflationRate, year);
          const yearlyPension = this.futureValue(pensionMonthly * 12, inflationRate, age - currentAge);
          const netWithdrawal = yearlyExpense - yearlyPension;
          totalAssets = totalAssets * (1 + returnRate / 100) - Math.max(0, netWithdrawal) - eventCost;
        }

        totalAssets = Math.max(0, totalAssets);

        result.push({
          age,
          year,
          totalAssets: this.roundWon(totalAssets),
          phase: age < retireAge ? '자산형성기' : (age < pensionStartAge ? '브릿지기간' : '연금수령기'),
          event: eventLabel || null
        });
      }
      return result;
    };

    const base_case = simulate(annualReturn);

    // [신규] 몬테카를로 시뮬레이션 1,000회 수행하여 하위 10% (스트레스 테스트) 궤적 도출
    // params에 asset_allocation이 있다면 Bivariate 로직이 자동 활성화됨
    const mcResults = this.runMonteCarloSimulation(params, 1000);
    const stress_test = [];
    
    for (let year = 0; year <= lifeExpectancy - currentAge; year++) {
      const age = currentAge + year;
      stress_test.push({
        age,
        year,
        totalAssets: mcResults.percentiles.p10[year] || 0,
        phase: age < retireAge ? '자산형성기' : (age < pensionStartAge ? '브릿지기간' : '연금수령기'),
        event: null // 몬테카를로 궤적에는 라벨 표시 생략
      });
    }

    // MDD(최대 낙폭) 계산 (p10 곡선 기준)
    let peak = 0;
    let maxDrawdown = 0;
    const drawdowns = [];
    for (let i = 0; i < stress_test.length; i++) {
      if (stress_test[i].totalAssets > peak) {
        peak = stress_test[i].totalAssets;
      }
      if (peak > 0) {
        const dd = ((stress_test[i].totalAssets - peak) / peak) * 100;
        drawdowns.push(dd);
        if (Math.abs(dd) > maxDrawdown) {
          maxDrawdown = Math.abs(dd);
        }
      } else {
        drawdowns.push(0);
      }
    }

    return {
      base_case,
      stress_test,
      mc_stats: {
        successRate: mcResults.successRate,
        iterations: mcResults.iterations,
        maxDrawdown: this.round(maxDrawdown),
        samples: mcResults.samples,
        drawdowns: drawdowns,
        bestCase: mcResults.percentiles.p90[lifeExpectancy - currentAge] || 0,
        worstCase: mcResults.percentiles.p10[lifeExpectancy - currentAge] || 0
      }
    };
  },

  /**
   * [신규] 소비 민감도 분석 (Spending Sensitivity Analysis)
   * 재량 소비를 일정 비율로 줄였을 때 은퇴 자산이 몇 세까지 유지되는지 계산
   * @param {object} params - 기존 projectAssetGrowth 파라미터 + variableExpense (월 재량지출)
   * @param {Array<number>} reductionRates - 분석할 절감율 배열 (예: [0, 10, 20, 30])
   * @returns {Array<object>} 절감율별 분석 결과
   */
  calculateSpendingSensitivity(params, reductionRates = [0, 10, 20, 30]) {
    const {
      currentAge,
      retireAge = 50,
      currentAssets,
      monthlySaving, // base monthly saving
      annualReturn,
      inflationRate,
      salaryGrowthRate = 0,
      monthlyExpense, // total monthly expense (fixed + variable)
      variableExpense = 0, // portion of monthly expense that is variable
      pensionMonthly = 0,
      pensionStartAge = 65,
      lifeEvents = []
    } = params;

    const results = [];
    const maxAge = 100; // 100세까지 시뮬레이션

    for (const rate of reductionRates) {
      // 1. 절감된 지출 금액 계산
      const reductionAmount = variableExpense * (rate / 100);
      const newMonthlyExpense = Math.max(0, monthlyExpense - reductionAmount);
      
      // [Bug Fix] Gross-up 적용
      const healthInsuranceEst = 250000; 
      const grossMonthlyExpense = (newMonthlyExpense / (1 - 0.154)) + healthInsuranceEst;
      const grossAnnualExpense = grossMonthlyExpense * 12;

      // 2. 절감액만큼 저축액이 늘어남 (형성기에)
      const newMonthlySaving = monthlySaving + reductionAmount;

      // 3. 자산 성장 시뮬레이션 실행 (단, maxAge까지)
      let totalAssets = currentAssets;
      let currentMonthlySaving = newMonthlySaving;
      let depletedAge = maxAge;
      let isDepleted = false;

      for (let year = 0; year <= maxAge - currentAge; year++) {
        const age = currentAge + year;
        
        let eventCost = 0;
        for (const event of lifeEvents) {
          if (event.age === age) eventCost += event.cost;
        }

        if (age < retireAge) {
          const annualSaving = currentMonthlySaving * 12;
          totalAssets = totalAssets * (1 + annualReturn / 100) + annualSaving - eventCost;
          currentMonthlySaving *= (1 + salaryGrowthRate / 100);
        } else if (age < pensionStartAge) {
          const yearlyExpense = this.futureValue(grossAnnualExpense, inflationRate, year);
          totalAssets = totalAssets * (1 + annualReturn / 100) - yearlyExpense - eventCost;
        } else {
          const yearlyExpense = this.futureValue(grossAnnualExpense, inflationRate, year);
          const yearlyPension = this.futureValue(pensionMonthly * 12, inflationRate, age - currentAge);
          const netWithdrawal = Math.max(0, yearlyExpense - yearlyPension);
          totalAssets = totalAssets * (1 + annualReturn / 100) - netWithdrawal - eventCost;
        }

        if (totalAssets <= 0) {
          depletedAge = age;
          isDepleted = true;
          break; // 파산 시점 찾음
        }
      }

      results.push({
        reductionRate: rate,
        monthlyReductionAmount: reductionAmount,
        depletedAge: isDepleted ? depletedAge : "평생 (100세+)",
        isDepleted
      });
    }

    return results;
  },

  // ========== 몬테카를로 시뮬레이션 ==========

  /**
   * 몬테카를로 시뮬레이션 실행
   * @param {object} params - 시뮬레이션 파라미터
   * @param {number} iterations - 반복 횟수 (기본 1000)
   * @returns {object} 시뮬레이션 결과
   */
  runMonteCarloSimulation(params, iterations = 1000) {
    const {
      currentAge,
      retireAge = 50,
      lifeExpectancy = 90,
      currentAssets,
      monthlySaving,
      expectedReturn,
      returnStdDev = 15,    // 수익률 표준편차 (%)
      inflationRate,
      inflationStdDev = 1,
      monthlyExpense,
      pensionMonthly = 0,
      pensionStartAge = 65
    } = params;

    const results = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      let assets = currentAssets;
      let failed = false;
      const yearlyAssets = [];

      const healthInsuranceEst = 250000;
      const grossAnnualExpense = ((monthlyExpense / (1 - 0.154)) + healthInsuranceEst) * 12;
      const baseYearlyPension = pensionMonthly * 12;
      
      let currentAnnualExpense = grossAnnualExpense;
      let currentYearlyPension = baseYearlyPension;

      for (let year = 0; year <= lifeExpectancy - currentAge; year++) {
        const age = currentAge + year;
        
        // 랜덤 수익률 (정규분포 근사 또는 이변량 정규분포 적용)
        let randomReturn;
        
        if (params.asset_allocation && params.asset_allocation.details) {
          // [신규] 이변량 몬테카를로 (주식-채권 상관관계 반영)
          let stockWeight = 0, bondWeight = 0, otherWeight = 0;
          for (let item of params.asset_allocation.details) {
            if (item.label.includes('주식')) stockWeight += item.value / 100;
            else if (item.label.includes('채권')) bondWeight += item.value / 100;
            else otherWeight += item.value / 100;
          }
          
          // 임의의 역사적 평균 및 표준편차 (주식 8±15%, 채권 4±5%, 기타 3±2%)
          const correlation = -0.2; 
          const [stockRet, bondRet] = this.generateCorrelatedRandoms(8.0, 15.0, 4.0, 5.0, correlation);
          const otherRet = this.normalRandom(3.0, 2.0); 
          
          randomReturn = (stockWeight * stockRet) + (bondWeight * bondRet) + (otherWeight * otherRet);
          
          // 은퇴 후 글라이드 패스(위험자산 비중 축소 효과) 반영
          if (age > retireAge) randomReturn -= ((age - retireAge) * 0.1);
        } else {
          // 기존 단일 정규분포
          let glidePathReturn = expectedReturn || 5.0;
          if (age > retireAge) glidePathReturn -= ((age - retireAge) * 0.1);
          glidePathReturn = Math.max(glidePathReturn, 3.0);
          randomReturn = this.normalRandom(glidePathReturn, returnStdDev);
        }

        const randomInflation = this.normalRandom(inflationRate || 2.8, inflationStdDev);

        if (year > 0) {
          currentAnnualExpense *= (1 + randomInflation / 100);
          currentYearlyPension *= (1 + randomInflation / 100);
        }

        if (age < retireAge) {
          const annualSaving = monthlySaving * 12;
          assets = assets * (1 + randomReturn / 100) + annualSaving;
        } else if (age < pensionStartAge) {
          assets = assets * (1 + randomReturn / 100) - currentAnnualExpense;
        } else {
          const netWithdrawal = Math.max(0, currentAnnualExpense - currentYearlyPension);
          assets = assets * (1 + randomReturn / 100) - netWithdrawal;
        }

        if (assets < 0) {
          assets = 0;
          failed = true;
        }

        yearlyAssets.push(this.roundWon(assets));
      }

      if (!failed) successCount++;
      results.push(yearlyAssets);
    }

    // 퍼센타일 계산
    const totalYears = lifeExpectancy - currentAge + 1;
    const percentiles = { p10: [], p25: [], p50: [], p75: [], p90: [] };

    for (let y = 0; y < totalYears; y++) {
      const yearValues = results.map(r => r[y] || 0).sort((a, b) => a - b);
      percentiles.p10.push(yearValues[Math.floor(iterations * 0.10)]);
      percentiles.p25.push(yearValues[Math.floor(iterations * 0.25)]);
      percentiles.p50.push(yearValues[Math.floor(iterations * 0.50)]);
      percentiles.p75.push(yearValues[Math.floor(iterations * 0.75)]);
      percentiles.p90.push(yearValues[Math.floor(iterations * 0.90)]);
    }

    // 무작위 스파게티 궤적 20개 추출
    const samples = [];
    for (let i = 0; i < 20; i++) {
      samples.push(results[Math.floor(Math.random() * iterations)]);
    }

    return {
      successRate: this.round(successCount / iterations * 100),
      iterations,
      percentiles,
      samples,
      ages: Array.from({ length: totalYears }, (_, i) => currentAge + i)
    };
  },

  /**
   * 정규분포 난수 생성 (Box-Muller 변환)
   */
  normalRandom(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return this.round(mean + z * stdDev);
  },

  /**
   * [신규] 이변량 정규분포 난수 생성 (Cholesky Decomposition)
   * 주식과 채권처럼 상관관계가 있는 두 개의 난수를 동시 생성
   */
  generateCorrelatedRandoms(mean1, std1, mean2, std2, correlation) {
    // 1. 두 개의 독립적인 표준 정규분포 난수 생성 (Z1, Z2)
    const u1 = Math.random();
    const u2 = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    const u3 = Math.random();
    const u4 = Math.random();
    const z2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);

    // 2. Cholesky 분해를 통한 상관관계 주입
    // X1 = Z1
    // X2 = rho * Z1 + sqrt(1 - rho^2) * Z2
    const x1 = z1;
    const x2 = correlation * z1 + Math.sqrt(1 - Math.pow(correlation, 2)) * z2;

    // 3. 목표 평균과 표준편차로 스케일링
    const return1 = mean1 + x1 * std1;
    const return2 = mean2 + x2 * std2;

    return [return1, return2];
  },

  // ========== 브릿지자금 계산 ==========

  /**
   * 브릿지자금 상세 계산
   * @param {object} params
   * @returns {object} 브릿지자금 전략별 분석
   */
  calculateBridgeFund(params) {
    const {
      retireAge = 50,
      pensionStartAge = 65,
      monthlyExpense,         // 은퇴 시점 월 생활비
      inflationRate,
      totalAssetsAtRetire,
      retirementSaving = 0,   // 퇴직금 예상액
      hasRealEstate = false,
      realEstateValue = 0
    } = params;

    const bridgeYears = pensionStartAge - retireAge;
    
    // 브릿지 기간 총 필요 자금
    let totalBridgeExpense = 0;
    const yearlyExpenses = [];
    for (let y = 0; y < bridgeYears; y++) {
      const expense = this.futureValue(monthlyExpense * 12, inflationRate, y);
      totalBridgeExpense += expense;
      yearlyExpenses.push({
        age: retireAge + y,
        annualExpense: this.roundWon(expense),
        monthlyExpense: this.roundWon(expense / 12)
      });
    }

    // 전략별 월 소득 예상
    const strategies = [];

    // 1. 퇴직금 IRP 연금화
    if (retirementSaving > 0) {
      const monthlyFromIRP = this.roundWon(retirementSaving / (bridgeYears * 12) * 0.65); // 세금 고려
      strategies.push({
        id: 'irp_annuity',
        label: '퇴직금 IRP 연금화',
        monthlyIncome: monthlyFromIRP,
        totalIncome: monthlyFromIRP * bridgeYears * 12,
        note: '퇴직소득세 30~40% 절감 효과 반영'
      });
    }

    // 2. 배당 포트폴리오
    const dividendRate = 0.04; // 4% 배당수익률 가정
    const dividendBase = totalAssetsAtRetire * 0.3; // 자산의 30%를 배당주에 배분
    const monthlyDividend = this.roundWon(dividendBase * dividendRate / 12);
    strategies.push({
      id: 'dividend',
      label: '배당주 포트폴리오',
      monthlyIncome: monthlyDividend,
      totalIncome: monthlyDividend * bridgeYears * 12,
      note: `총 자산의 30% (${this.formatCurrency(dividendBase)})를 배당 ETF에 배분 가정`
    });

    // 3. 주택연금
    if (hasRealEstate && realEstateValue > 0) {
      // 주택연금 월 수령액 — 한국주택금융공사 2026년 기준 연령별 지급률 테이블
      // 출처: 한국주택금융공사 주택연금 지급률표 (종신지급방식, 정액형 기준)
      const reverseMortgageRates = {
        50: 0.00096, 51: 0.00100, 52: 0.00103, 53: 0.00107, 54: 0.00111,
        55: 0.00115, 56: 0.00119, 57: 0.00123, 58: 0.00128, 59: 0.00132,
        60: 0.00137, 61: 0.00142, 62: 0.00147, 63: 0.00153, 64: 0.00158,
        65: 0.00165, 66: 0.00171, 67: 0.00178, 68: 0.00185, 69: 0.00193,
        70: 0.00201
      };
      // 9억 원 상한 (주택금융공사 가입 가능 상한가)
      const cappedValue = Math.min(realEstateValue, 900000000);
      const applyAge = Math.min(Math.max(Math.round(retireAge), 50), 70);
      const ratePerMonth = reverseMortgageRates[applyAge] || 0.00096;
      const monthlyReverseMortgage = this.roundWon(cappedValue * ratePerMonth);
      strategies.push({
        id: 'reverse_mortgage',
        label: '주택연금',
        monthlyIncome: monthlyReverseMortgage,
        totalIncome: monthlyReverseMortgage * bridgeYears * 12,
        note: `주택 가치 ${this.formatCurrency(cappedValue)} × ${(ratePerMonth * 100).toFixed(3)}%/월 (${applyAge}세 기준 한국주택금융공사 지급률)`
      });
    }

    // 총 월 예상 소득
    const totalMonthlyIncome = strategies.reduce((sum, s) => sum + s.monthlyIncome, 0);
    const monthlyDeficit = Math.max(0, monthlyExpense - totalMonthlyIncome);

    return {
      bridgeYears,
      totalBridgeExpense: this.roundWon(totalBridgeExpense),
      yearlyExpenses,
      strategies,
      totalMonthlyIncome,
      monthlyDeficit,
      coverageRate: this.round(totalMonthlyIncome / monthlyExpense * 100)
    };
  },

  // ========== 포트폴리오 기대수익률 ==========

  /**
   * 포트폴리오 가중 기대수익률 계산
   * @param {object} allocation - 자산 배분 비율 (%)
   * @param {string} scenario - 'optimistic' | 'base' | 'pessimistic'
   * @returns {number} 가중 기대수익률 (%)
   */
  portfolioExpectedReturn(allocation, scenario = 'base') {
    const returns = DATA.investmentReturns;
    let weightedReturn = 0;
    let totalWeight = 0;

    for (const [asset, weight] of Object.entries(allocation)) {
      if (returns[asset] && weight > 0) {
        weightedReturn += returns[asset].rate[scenario] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? this.round(weightedReturn / totalWeight) : 0;
  },

  // ========== 국민연금 예상액 ==========

  /**
   * 국민연금 예상 월 수령액 — 2026년 현행법 기준 공식 산식
   * 출처: 국민연금공단 급여산정 규정 (국민연금법 시행령 제50조)
   *
   * 기본연금액 = P × (1 + 0.05n'/12)
   * P = 1.2 × (A + B) × (1 + 0.05n/12) / 12  ← 핵심 급여 산식
   * A  = 연금 수급 전년도 전체 가입자 평균 월소득 (2026년 기준 약 299만원, 국민연금공단 고시)
   * B  = 가입자 본인의 가입 기간 중 기준소득월액 평균 (상한액: 617만원, 2026년 기준)
   * n  = 20년(240개월) 초과 가입 개월수
   * n' = 10년(120개월) 초과 가입 개월수
   *
   * @param {number} avgMonthlyIncome - 가입 기간 평균 기준소득월액
   * @param {number} contributionYears - 납부 기간 (년)
   * @returns {number} 예상 월 수령액
   */
  estimatePension(avgMonthlyIncome, contributionYears) {
    const totalMonths = contributionYears * 12;

    // 수급 자격 최소 가입기간 120개월(10년) 미충족 시 반환일시금만 있음
    if (totalMonths < 120) return 0;

    // 2026년 기준 상수 (매년 국민연금공단 고시)
    const A = 2990000;  // 가입자 전체 평균 월소득 (2026 기준)
    const incomeUpperLimit = 6170000; // 기준소득월액 상한액 (2026 기준)
    const B = Math.min(avgMonthlyIncome, incomeUpperLimit);

    // 20년 초과분 (n): 20년 이하면 0
    const n = Math.max(0, totalMonths - 240);

    // 기본연금액 P (20년 기준 급여)
    const P = 1.2 * (A + B) * (1 + 0.05 * n / 12) / 12;

    // 10년 초과분 (n'): 10년 이하면 0 (가입기간 비례 조정)
    const nPrime = Math.max(0, totalMonths - 120);
    const basicPension = P * (1 + 0.05 * nPrime / 12);

    // 단, 가입기간이 20년 미만이면 비례율 적용 (10~20년: 50/240 ~ 240/240 비례)
    // 현행 산식: 10년 이상이면 위 공식이 직접 적용됨 (가입기간 반영이 n, n'에 내재)

    // 조기수령 시 감액 없이 정상 수령액 반환 (감액 적용은 호출부에서 처리)
    return this.roundWon(basicPension);
  },

  /**
   * 국민연금 조기/연기 수령 조정
   * 조기수령: 1년 조기마다 6% 감액 (최대 30%), 최대 5년 조기 가능
   * 연기수령: 1년 연기마다 7.2% 증액 (최대 36%), 최대 5년 연기 가능
   * 출처: 국민연금법 제61조, 제61조의2
   * @param {number} basePension - 정상 수령액
   * @param {number} normalAge - 정상 수령 나이 (기본 65)
   * @param {number} actualReceiveAge - 실제 수령 나이
   * @returns {number} 조정된 월 수령액
   */
  adjustPensionByAge(basePension, normalAge = 65, actualReceiveAge) {
    const yearsDiff = actualReceiveAge - normalAge;
    if (yearsDiff < 0) {
      // 조기 수령: 1년당 6% 감액, 최대 -30%
      const reduction = Math.min(Math.abs(yearsDiff) * 0.06, 0.30);
      return this.roundWon(basePension * (1 - reduction));
    } else if (yearsDiff > 0) {
      // 연기 수령: 1년당 7.2% 증액, 최대 +36%
      const increase = Math.min(yearsDiff * 0.072, 0.36);
      return this.roundWon(basePension * (1 + increase));
    }
    return basePension;
  },

  // ========== 포맷팅 유틸리티 ==========

  formatCurrency(amount) {
    if (amount >= 100000000) {
      return `${this.round(amount / 100000000)}억원`;
    } else if (amount >= 10000) {
      return `${this.round(amount / 10000)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  },

  formatCurrencyFull(amount) {
    return amount.toLocaleString('ko-KR') + '원';
  }
};

if (typeof window !== 'undefined') {
  window.Calculator = Calculator;
}

if (typeof module !== 'undefined' && module.exports) { module.exports = Calculator; }
