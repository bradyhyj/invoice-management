<script>
  export let title = "정말 진행하시겠습니까?";
  export let message = "이 작업은 되돌릴 수 없습니다.";
  export let confirmText = "확인";
  export let cancelText = "취소";
  export let icon = "⚠️";
  export let isProcessing = false;
  export let confirmColor = "bg-red-500 hover:bg-red-600"; // 위험한 작업은 빨간색, 일반 작업은 파란색 등으로 변경 가능

  export let onConfirm;
  export let onCancel;
</script>

<div class="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
    <div class="p-6 text-center">
      <!-- 동적 아이콘 -->
      <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
        {icon}
      </div>
      
      <h3 class="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p class="text-sm text-slate-500 mb-6 leading-relaxed">
        <!-- html 태그(<br/> 등)가 적용될 수 있도록 @html 사용 -->
        {@html message} 
      </p>
      
      <div class="flex gap-3">
        <button 
          on:click={onCancel} 
          disabled={isProcessing}
          class="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button 
          on:click={onConfirm} 
          disabled={isProcessing}
          class="flex-1 px-4 py-2.5 {confirmColor} text-white font-bold rounded-xl transition-colors flex justify-center items-center disabled:opacity-50"
        >
          {#if isProcessing}
            <span class="animate-pulse">처리 중...</span>
          {:else}
            {confirmText}
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>