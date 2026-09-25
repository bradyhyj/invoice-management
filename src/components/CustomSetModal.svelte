<script>
  // @ts-nocheck <- 타입 검사 중지
  // 부모(App.svelte)로부터 전달받을 함수들
  export let onClose;
  export let onApply;
  export let onError;

  let customSetTotal = "";
  let customSetCount = "";

  function handleSubmit() {
    const total = Number(customSetTotal);
    const count = Number(customSetCount);

    if (!total || !count || count <= 0) {
      onError("총 금액과 세트 수를 정확히 입력해주세요.");
      return;
    }

    // 단가를 항상 1원 단위로 올림처리
    const unitPrice = Math.ceil(total / count);
    
    const mainAmount = unitPrice * count;
    const remainder = total - mainAmount; // 오버된 금액이므로 무조건 0 또는 마이너스(-) 값이 됨

    onApply({ unitPrice, count, mainAmount, remainder });
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
  <div class="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
    <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
      <h3 class="font-bold text-lg text-indigo-800">맞춤형 세트 계산기</h3>
      <button on:click={onClose} class="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
    </div>
    
    <div class="p-6 space-y-4 bg-white">
      <!-- 총 금액 입력 칸 -->
      <div>
        <label for="customSetTotalInput" class="block text-sm font-bold text-slate-700 mb-1">고객이 요청한 총 금액</label>
        <div class="flex items-center border border-slate-300 rounded-lg px-4 py-2 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
          <input id="customSetTotalInput" type="number" bind:value={customSetTotal} placeholder="100000" class="flex-1 w-full outline-none text-right font-bold text-slate-800 bg-transparent" />
          <span class="ml-2 text-slate-400 text-sm font-bold whitespace-nowrap">원</span>
        </div>
      </div>
      
      <!-- 세트 수 입력칸 -->
      <div>
        <label for="customSetCountInput" class="block text-sm font-bold text-slate-700 mb-1">나눠야 할 세트 수</label>
        <div class="flex items-center border border-slate-300 rounded-lg px-4 py-2 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
          <input id="customSetCountInput" type="number" bind:value={customSetCount} placeholder="3" class="flex-1 w-full outline-none text-right font-bold text-slate-800 bg-transparent" />
          <span class="ml-2 text-slate-400 text-sm font-bold whitespace-nowrap">세트</span>
        </div>
      </div>
      
      <div class="bg-slate-50 p-3 rounded text-xs text-slate-500 leading-relaxed border border-slate-100">
        * 10원 미만 금액은 <b>항상 자동 절사</b>되며, 남은 잔액은 다음 줄에 <b>'끝수처리(절사)'</b>로 깔끔하게 처리됩니다.
      </div>
    </div>
    
    <div class="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-2">
      <button on:click={onClose} class="px-4 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50">취소</button>
      <button on:click={handleSubmit} class="px-4 py-2 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white">추가하기</button>
    </div>
  </div>
</div>