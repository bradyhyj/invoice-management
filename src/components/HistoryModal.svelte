<script>
  // @ts-nocheck <- 타입 검사 중지
  import { onMount } from "svelte";
  import { db } from "../lib/firebase.js";
  import { collection, query, orderBy, getDocs } from "firebase/firestore";

  export let onClose;
  export let onLoad;

  let historyList = [];
  let isLoading = true;

  // 화면 모드 관리 ('calendar' | 'list')
  let displayMode = 'calendar'; 

  // 달력 상태 및 뷰(View) 관리
  let today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth(); // 0 ~ 11
  
  let calendarView = 'day'; 
  let yearPageStart = currentYear - (currentYear % 12); 

  let selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  onMount(async () => {
    try {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      historyList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (e) {
      console.error("내역 불러오기 실패:", e);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      isLoading = false;
    }
  });

  $: docsByDate = historyList.reduce((acc, doc) => {
    const d = doc.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(doc);
    return acc;
  }, {});

  $: firstDay = new Date(currentYear, currentMonth, 1).getDay();
  $: daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();$: calendarGrid = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  function handleHeaderClick() {
    if (calendarView === 'day') calendarView = 'month';
    else if (calendarView === 'month') {
      calendarView = 'year';
      yearPageStart = currentYear - (currentYear % 12);
    }
  }

  function handlePrev() {
    if (calendarView === 'day') {
      if (currentMonth === 0) { currentMonth = 11; currentYear--; } 
      else { currentMonth--; }
    } 
    else if (calendarView === 'month') { currentYear--; } 
    else if (calendarView === 'year') { yearPageStart -= 12; }
  }

  function handleNext() {
    if (calendarView === 'day') {
      if (currentMonth === 11) { currentMonth = 0; currentYear++; } 
      else { currentMonth++; }
    } 
    else if (calendarView === 'month') { currentYear++; } 
    else if (calendarView === 'year') { yearPageStart += 12; }
  }

  function setMonth(m) {
    currentMonth = m;
    calendarView = 'day';
  }

  function setYear(y) {
    currentYear = y;
    calendarView = 'month';
  }

  function selectDate(day) {
    if (!day) return;
    selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function calculateTotal(items) {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[650px]">
    
    <!-- 모달 헤더 -->
    <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
      <h3 class="font-bold text-lg text-slate-800">📂 저장된 문서 불러오기</h3>
      
      <div class="flex items-center gap-4">
        <!-- 💡 모드 전환 버튼 -->
        <button 
          on:click={() => displayMode = displayMode === 'calendar' ? 'list' : 'calendar'}
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-sm transition-colors border
            {displayMode === 'calendar' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}"
        >
          {#if displayMode === 'calendar'}
            📃 전체 리스트 보기
          {:else}
            📅 달력으로 보기
          {/if}
        </button>
        <button on:click={onClose} class="text-slate-400 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- 본문 영역 -->
    {#if displayMode === 'calendar'}
      <!-- 모드 1: 달력 뷰 (좌우 분할) -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 왼쪽: 달력 영역 -->
        <div class="w-1/2 border-r border-slate-200 p-6 flex flex-col bg-white select-none">
          <div class="flex justify-between items-center mb-6">
            <button on:click={handlePrev} class="p-2 hover:bg-slate-100 rounded-full text-slate-600 font-bold w-10 h-10 flex items-center justify-center transition-colors">&lt;</button>
            <button on:click={handleHeaderClick} class="text-lg font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600 px-4 py-1.5 rounded-lg transition-colors">
              {#if calendarView === 'day'} {currentYear}년 {currentMonth + 1}월
              {:else if calendarView === 'month'} {currentYear}년
              {:else if calendarView === 'year'} {yearPageStart} - {yearPageStart + 11}
              {/if}
            </button>
            <button on:click={handleNext} class="p-2 hover:bg-slate-100 rounded-full text-slate-600 font-bold w-10 h-10 flex items-center justify-center transition-colors">&gt;</button>
          </div>

          <div class="flex-1 flex flex-col">
            {#if calendarView === 'day'}
              <div class="grid grid-cols-7 gap-1 text-center mb-2">
                <div class="text-xs font-bold text-red-500">일</div>
                <div class="text-xs font-bold text-slate-500">월</div>
                <div class="text-xs font-bold text-slate-500">화</div>
                <div class="text-xs font-bold text-slate-500">수</div>
                <div class="text-xs font-bold text-slate-500">목</div>
                <div class="text-xs font-bold text-slate-500">금</div>
                <div class="text-xs font-bold text-blue-500">토</div>
              </div>
              <div class="grid grid-cols-7 gap-1 flex-1 content-start">
                {#each calendarGrid as day}
                  {#if day === null}
                    <div class="h-12"></div>
                  {:else}
                    {@const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`}
                    {@const isSelected = selectedDateStr === dateString}
                    {@const hasData = docsByDate[dateString] && docsByDate[dateString].length > 0}
                    <button on:click={() => selectDate(day)} class="relative h-12 w-full flex flex-col items-center justify-center rounded-lg transition-colors {isSelected ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-100 text-slate-700'}">
                      <span>{day}</span>
                      {#if hasData}<div class="absolute bottom-2 w-1.5 h-1.5 rounded-full {isSelected ? 'bg-white' : 'bg-indigo-500'}"></div>{/if}
                    </button>
                  {/if}
                {/each}
              </div>
            {:else if calendarView === 'month'}
              <div class="grid grid-cols-3 gap-3 flex-1 content-center h-full pb-10">
                {#each Array(12) as _, i}
                  <button on:click={() => setMonth(i)} class="h-16 rounded-xl flex items-center justify-center font-bold text-lg transition-colors {currentMonth === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}">{i + 1}월</button>
                {/each}
              </div>
            {:else if calendarView === 'year'}
              <div class="grid grid-cols-3 gap-3 flex-1 content-center h-full pb-10">
                {#each Array(12) as _, i}
                  {@const y = yearPageStart + i}
                  <button on:click={() => setYear(y)} class="h-16 rounded-xl flex items-center justify-center font-bold text-lg transition-colors {currentYear === y ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}">{y}년</button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- 오른쪽: 선택된 날짜의 목록 -->
        <div class="w-1/2 bg-slate-50 p-6 overflow-y-auto">
          <div class="mb-4 flex items-center justify-between">
            <h4 class="font-bold text-slate-800 text-base border-b-2 border-slate-800 pb-1 inline-block">{selectedDateStr} 내역</h4>
            <span class="text-xs font-medium text-slate-500">총 {docsByDate[selectedDateStr] ? docsByDate[selectedDateStr].length : 0}건</span>
          </div>

          {#if isLoading}
            <div class="mt-10 text-center text-sm text-slate-400 font-medium animate-pulse">데이터를 불러오는 중입니다...</div>
          {:else if !docsByDate[selectedDateStr] || docsByDate[selectedDateStr].length === 0}
            <div class="mt-20 text-center flex flex-col items-center">
              <div class="text-4xl mb-3 opacity-20">📭</div>
              <p class="text-sm text-slate-500 font-medium">해당 날짜에 작성된 명세서가 없습니다.</p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each docsByDate[selectedDateStr] as doc}
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded {doc.docType === 'invoice' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}">{doc.docType === 'invoice' ? '명세서' : '견적서'}</span>
                      <span class="text-xs text-slate-400 font-mono">No. {doc.id.slice(0, 5).toUpperCase()}</span>
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="font-bold text-slate-800 text-lg">{doc.customerName || '거래처 미상'}</div>
                    <div class="text-sm text-slate-500 truncate mt-0.5">{doc.items[0]?.name || '품목 없음'} {#if doc.items.length > 1} 외 {doc.items.length - 1}건{/if}</div>
                  </div>
                  <div class="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                    <div class="font-bold text-slate-900">₩{calculateTotal(doc.items).toLocaleString()}</div>
                    <button on:click={() => onLoad(doc)} class="px-4 py-1.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">불러오기</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    {:else}
      <!-- 모드 2: 전체 리스트 뷰 -->
      <div class="flex-1 overflow-y-auto bg-slate-50 p-6">
        {#if isLoading}
          <div class="mt-20 text-center text-sm text-slate-400 font-medium animate-pulse">데이터를 불러오는 중입니다...</div>
        {:else if historyList.length === 0}
          <div class="mt-20 text-center flex flex-col items-center">
            <div class="text-4xl mb-3 opacity-20">📭</div>
            <p class="text-sm text-slate-500 font-medium">저장된 명세서가 없습니다.</p>
          </div>
        {:else}
          <div class="space-y-3 max-w-3xl mx-auto">
            {#each historyList as doc}
              <!-- 가로로 넓게 펼쳐진 리스트 카드 -->
              <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group">
                <div class="flex items-center gap-6 w-2/3">
                  <!-- 날짜 및 뱃지 -->
                  <div class="flex flex-col items-center gap-1.5 w-24 shrink-0 border-r border-slate-100 pr-4">
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded w-full text-center {doc.docType === 'invoice' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}">
                      {doc.docType === 'invoice' ? '명세서' : '견적서'}
                    </span>
                    <span class="text-xs text-slate-500 font-bold whitespace-nowrap">{doc.date}</span>
                  </div>
                  
                  <!-- 거래처 및 품목 정보 -->
                  <div class="flex-1 truncate">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="font-bold text-slate-800 text-lg truncate">{doc.customerName || '거래처 미상'}</div>
                      <span class="text-xs text-slate-400 font-mono hidden sm:inline-block">No. {doc.id.slice(0, 5).toUpperCase()}</span>
                    </div>
                    <div class="text-sm text-slate-500 truncate">
                      {doc.items[0]?.name || '품목 없음'} 
                      {#if doc.items.length > 1} <span class="ml-1 text-slate-400">외 {doc.items.length - 1}건</span> {/if}
                    </div>
                  </div>
                </div>

                <!-- 금액 및 불러오기 버튼 -->
                <div class="flex items-center gap-6 pl-4">
                  <div class="font-bold text-slate-900 text-lg text-right w-28 shrink-0">
                    ₩{calculateTotal(doc.items).toLocaleString()}
                  </div>
                  <button 
                    on:click={() => onLoad(doc)} 
                    class="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0"
                  >
                    불러오기
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>