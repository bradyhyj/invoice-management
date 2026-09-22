<script>
  // @ts-nocheck <- 타입 검사 중지
  export let policy; // 선택된 할인 정책 (discountConfig.js 에서 옴)
  export let items; // 현재 입력된 품목 리스트
  export let onClose; // 닫기 함수
  export let onApply; // 할인 적용 함수

  // 할인 가능한 품목만 추려내기 (봉투 같은 isDiscountable: false 제외, 빈칸 제외)
  $: validItems = items
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter((item) => item.isDiscountable && item.name && item.amount > 0);

  // 💡 모달 내부 상태값
  // 임의할인용
  let customType = "amount"; // 'amount'(원) or 'percent'(%)
  let customValue = "";

  // SKT 관련
  let selectedTier = "SILVER"; // 기본값
  let selectedIndices = []; // 체크박스로 선택한 품목들의 원래 인덱스 배열

  // 체크박스 전체 선택/해제 토글
  function toggleAllSelection(e) {
    if (e.target.checked) {
      selectedIndices = validItems.map((item) => item.originalIndex);
    } else {
      selectedIndices = [];
    }
  }

  $: discountableAmount = validItems.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  ); // 할인 적용 가능한 품목 합계

  // 정책 기반 할인 상한값 계산 함수
  function getMaxPointLimit(amount, policyConfig) {
    let limit = amount;

    // 1. maxUsagePercent가 존재하면 그 비율만큼 한도 설정 (소수점 버림)
    if (policyConfig.maxUsagePercent) {
      limit = Math.floor(amount * (policyConfig.maxUsagePercent / 100));
    }

    // 2. 포인트 단위(pointUnit)가 설정되어 있다면 단위에 맞게 절사 (예: 50750 -> 50700)
    if (policyConfig.pointUnit) {
      limit = Math.floor(limit / policyConfig.pointUnit) * policyConfig.pointUnit;
    }

    // 최종 계산 리턴
    return limit;
  }

  // 💡 최종 할인 금액 계산 로직
  $: calculatedDiscount = (() => {
    let totalDiscount = 0;

    if (policy.type === "POINT_INPUT") {
      // 포인트를 직접 입력하는 경우
      // lib/discountConfig.js의 정책 기반으로 할인 상한값 계산
      const limit = getMaxPointLimit(discountableAmount, policy);

      // 사용자가 직접 타이핑한 값(customValue)이 한도를 넘지 못하도록 강제 차단
      totalDiscount = Math.min(Number(customValue) || 0, limit);
    } else if (policy.type === "CUSTOM_MANUAL") {
      const val = Number(customValue) || 0;
      if (customType === "amount") {
        totalDiscount = val;
      } else if (customType === "percent") {
        totalDiscount = discountableAmount * (val / 100);
      }
    } else if (
      policy.type === "PERCENT_TIER" ||
      policy.type === "PERCENT_OFF"
    ) {
      // 선택된 품목들의 합계 계산
      const selectedTotal = validItems
        .filter((item) => selectedIndices.includes(item.originalIndex))
        .reduce((sum, item) => sum + Number(item.amount), 0);

      let rate =
        policy.type === "PERCENT_TIER"
          ? policy.tiers[selectedTier]
          : policy.rate;
      totalDiscount = selectedTotal * rate;

      // 원 단위 절사 (예: 115원 -> 110원)
      totalDiscount = Math.floor(totalDiscount / 10) * 10;

      // 최대 한도 적용
      let limit =
        policy.type === "PERCENT_TIER"
          ? policy.maxLimits[selectedTier]
          : policy.maxLimit;
      if (totalDiscount > limit) totalDiscount = limit;
    }

    return totalDiscount;
  })();

  // 적용 버튼 클릭 시 App.svelte로 데이터 넘겨주기
  function handleApply() {
    if (calculatedDiscount <= 0) {
      return alert("할인 금액이 0원입니다. 입력값을 확인해주세요.");
    }

    // 포인트 사용 유효성 검사
    if (policy.type === "POINT_INPUT") {
      // 최소 사용 금액(minUsage) 체크
      if (policy.minUsage && calculatedDiscount < policy.minUsage) {
        return alert(
          `포인트는 최소 ${policy.minUsage.toLocaleString()}P 이상부터 사용 가능합니다.`,
        );
      }

      // 단위(pointUnit) 체크 (JSON에 pointUnit: 100을 추가했을 경우 작동)
      if (policy.pointUnit && calculatedDiscount % policy.pointUnit !== 0) {
        return alert(`포인트는 ${policy.pointUnit}P 단위로만 사용 가능합니다.`);
      }
    }

    // 명세서에 찍힐 할인명 만들기 (예: SKT T멤버십(GOLD) 할인)
    let noteName = policy.name;
    if (policy.type === "PERCENT_TIER") noteName += `(${selectedTier})`;

    onApply({
      name: noteName + " 할인",
      amount: -calculatedDiscount, // 💡 뺄셈이 되어야 하므로 마이너스 처리
    });
  }
</script>

<!-- 배경 어둡게 (Backdrop) -->
<div
  class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
>
  <!-- 모달 창 -->
  <div
    class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
  >
    <!-- 헤더 -->
    <div
      class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50"
    >
      <h3 class="font-bold text-lg text-slate-800">{policy.name} 적용</h3>
      <button
        on:click={onClose}
        class="text-slate-400 hover:text-red-500 font-bold text-xl"
        >&times;</button
      >
    </div>

    <!-- 본문 스크롤 영역 -->
    <div class="p-6 overflow-y-auto space-y-6">
      <!-- 안내 문구 (노란색 박스) -->
      <div
        class="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 whitespace-pre-line leading-relaxed"
      >
        {policy.warningMessage}
      </div>

      <!-- 1. 임의할인 (CUSTOM_MANUAL) 입력 폼 -->
      {#if policy.type === "CUSTOM_MANUAL"}
        <div class="space-y-3">
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                bind:group={customType}
                value="amount"
                class="w-4 h-4 text-indigo-600"
              />
              <span class="font-medium text-slate-700">금액(원) 할인</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                bind:group={customType}
                value="percent"
                class="w-4 h-4 text-indigo-600"
              />
              <span class="font-medium text-slate-700">퍼센트(%) 할인</span>
            </label>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              bind:value={customValue}
              placeholder={customType === "amount"
                ? "할인할 금액 입력"
                : "할인율(%) 입력"}
              class="flex-1 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
            />
            <span class="font-bold text-slate-600"
              >{customType === "amount" ? "원" : "%"}</span
            >
          </div>
        </div>
      {/if}

      <!-- 2. SKT T멤버십 (PERCENT_TIER) 등급 선택 -->
      {#if policy.type === "PERCENT_TIER"}
        <div class="space-y-2">
          <div class="font-bold text-slate-700 text-sm">고객 등급 선택</div>
          <div class="flex gap-4">
            {#each Object.keys(policy.tiers) as tier}
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  bind:group={selectedTier}
                  value={tier}
                  class="w-4 h-4 text-indigo-600"
                />
                <span class="font-medium text-slate-700"
                  >{tier} ({policy.tiers[tier] * 100}%)</span
                >
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 3. 품목 선택 (requiresItemSelection === true 일 때만 등장) -->
      {#if policy.requiresItemSelection}
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <div
            class="bg-slate-100 px-4 py-2 font-bold text-sm text-slate-700 flex justify-between items-center"
          >
            <span>할인 적용할 품목 선택</span>
            <label
              class="flex items-center gap-2 cursor-pointer text-xs font-normal"
            >
              <input
                type="checkbox"
                on:change={toggleAllSelection}
                class="rounded text-indigo-600"
              />
              전체선택
            </label>
          </div>
          <div class="max-h-40 overflow-y-auto divide-y divide-slate-100">
            {#if validItems.length === 0}
              <div class="p-4 text-center text-sm text-slate-500">
                할인을 적용할 수 있는 품목이 없습니다.
              </div>
            {/if}
            {#each validItems as item}
              <label
                class="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    bind:group={selectedIndices}
                    value={item.originalIndex}
                    class="w-4 h-4 rounded text-indigo-600"
                  />
                  <span class="text-sm font-medium text-slate-700"
                    >{item.name}
                    <span class="text-slate-400 text-xs">({item.qty}개)</span
                    ></span
                  >
                </div>
                <span class="text-sm font-bold text-slate-900"
                  >{Number(item.amount).toLocaleString()}원</span
                >
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 4. 포인트 할인 -->
      {#if policy.type === "POINT_INPUT"}
        <div class="space-y-4">
          <div
            class="border border-slate-200 rounded-lg overflow-hidden bg-white"
          >
            <div class="p-4 space-y-4">
              <hr class="border-slate-100" />

              <!-- 사용할 포인트 입력 -->
              <div>
                <div class="flex justify-between items-end mb-2">
                  <label class="text-sm font-bold text-slate-700"
                    >사용할 포인트 입력</label
                  >
                  <button
                    class="text-xs font-medium text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-2"
                    on:click={() => {
                      // 할인 최대 적용 가능한 금액을 계산
                      customValue = getMaxPointLimit(
                        discountableAmount,
                        policy,
                      );
                    }}
                  >
                    할인 최대 적용
                  </button>
                </div>

                <div class="relative">
                  <input
                    type="number"
                    bind:value={customValue}
                    placeholder="0"
                    class="w-full border-2 border-indigo-100 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right pr-8 font-bold text-lg text-slate-800"
                  />
                  <span
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                    >P</span
                  >
                </div>
                <p class="text-[11px] text-slate-400 mt-2">
                  * 1P는 1원으로 환산되어 결제 금액에서 차감됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- 푸터 (결과 표시 및 버튼) -->
    <div
      class="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between rounded-b-xl"
    >
      <div>
        <div class="text-xs text-slate-500 font-bold mb-1">할인금액</div>
        <div class="text-2xl font-black text-red-600">
          -{calculatedDiscount.toLocaleString()}원
        </div>
      </div>
      <div class="flex gap-2">
        <button
          on:click={onClose}
          class="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50"
          >취소</button
        >
        <button
          on:click={handleApply}
          disabled={calculatedDiscount <= 0}
          class="px-5 py-2.5 rounded-lg font-bold transition-all duration-200
            {calculatedDiscount > 0 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
              : 'bg-red-50 text-red-200 cursor-not-allowed'}"
        >할인 적용하기</button
        >
      </div>
    </div>
  </div>
</div>
