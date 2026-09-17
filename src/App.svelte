<script>
  // @ts-nocheck <- 타입 검사 중지
  import DocumentForm from "./components/DocumentForm.svelte";  // 만든 공통 컴포넌트 불러오기
  import { discountPolicies } from "./lib/discountConfig.js"; // 할인 정책 JSON 불러오기

  // 1. 데이터(상태) 선언부
  const now = new Date();
  let year = String(now.getFullYear());
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");

  let stampImg = "";

  let supplier = {
    bizNum: "123-45-67890",
    name: "엄마네 가게 상호",
    boss: "홍길동",
    address: "부산광역시 OO구 OO로 123",
    category: "음식",
    type: "도너츠, 음료",
    tel: "051-123-4567",
  };

  let customer = { name: "" };
  let bottomRemark = "";

  // 15칸 빈칸 배열
  // 할인 가능 여부(isDiscountable)를 통해 환경규제로 정해진 금액은 할인 걸러내기
  let items = Array(15)
    .fill()
    .map(() => ({
      name: "",
      spec: "",
      qty: "",
      price: "",
      amount: "",
      note: "",
      isDiscountable: true,
    }));
  items[0] = {
    name: "버라이어티팩(6개입)",
    spec: "EA",
    qty: 8,
    price: 12200,
    amount: "",
    note: "",
    isDiscountable: true,
  };

  // 잠금 및 상태 제어 로직
  let discountRowIndex = -1; // 할인이 적용된 빈칸의 인덱스
  let roundingRowIndex = -1; // 끝수 처리가 적용된 인덱스
  $: isLocked = discountRowIndex !== -1 || roundingRowIndex !== -1;

  function getEmptyRowIndex() {
    return items.findIndex(item => !item.name && !item.qty && !item.price && (!item.amount || item.amount === ""));
  }

  // 빠른 품목 추가
  const quickItems = [
    { name: "비닐쇼핑백", price: 100, isDiscountable: false, note: "" },
    { name: "종이쇼핑백", price: 200, isDiscountable: false, note: "" },
    { name: "아메리카노(HOT)", price: 3900, isDiscountable: true, note: "" },
  ];

  function addQuickItem(qItem) {
    if (isLocked) return alert("할인이 적용된 상태에서는 품목을 추가할 수 없습니다. 할인을 먼저 취소해주세요.");
    
    const idx = getEmptyRowIndex();
    if (idx === -1) return alert("명세서에 빈 칸이 없습니다.");

    items[idx] = {
      name: qItem.name,
      spec: "EA",
      qty: 1,
      price: qItem.price,
      amount: qItem.price, // 수량*단가로 자동 계산되지만 명시적으로 넣음
      note: qItem.note,
      isDiscountable: qItem.isDiscountable
    };
    items = [...items]; // Svelte 화면 갱신
  }

  // 할인 버튼 클릭 핸들러
  function handleDiscountClick(policy) {
    if (isLocked) return alert("이미 다른 할인이 적용되어 있습니다. 먼저 취소해주세요.");
    
    // TODO: 다음 단계에서 팝업창을 띄우는 로직으로 교체할 예정
    console.log("선택된 할인:", policy);
    alert(`[${policy.name}] 적용 준비!\n\n가이드: ${policy.warningMessage}`);
  }

  // 할인 취소 기능
  function cancelDiscount() {
    if (discountRowIndex !== -1) {
      items[discountRowIndex] = { name: "", spec: "", qty: "", price: "", amount: "", note: "", isDiscountable: true };
      discountRowIndex = -1;
      items = [...items];
    }
  }

  // 문서 타입 상태 (토글용)
  let currentType = "invoice";

  // 견적서 <-> 명세서 전환 함수
  function toggleType() {
    currentType = currentType === "invoice" ? "quote" : "invoice";
  }
</script>

<!-- 화면 최상단에 문서 타입 전환 버튼 추가 -->
<div class="text-center pt-4 bg-slate-50 print:hidden">
  <button
    on:click={toggleType}
    class="px-4 py-2 bg-slate-800 text-white rounded-lg"
  >
    {currentType === "invoice"
      ? "견적서 모드로 전환"
      : "거래명세서 모드로 전환"}
  </button>
</div>

<!-- 💡 관리자 컨트롤 패널 (인쇄 시 숨김) -->
  <div class="max-w-4xl mx-auto mt-4 print:hidden space-y-3">
    
    <!-- 🛍️ 섹션 1: 빠른 품목 추가 -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-300">
      <div class="text-sm font-bold text-slate-700 mb-2">🛍️ 빠른 품목 추가</div>
      <div class="flex gap-2 flex-wrap">
        {#each quickItems as qItem}
          <button 
            on:click={() => addQuickItem(qItem)}
            class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm font-medium rounded"
          >
            + {qItem.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- 💸 섹션 2: 결제 및 할인 정책 -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-300">
      <div class="flex justify-between items-center mb-2">
        <div class="text-sm font-bold text-slate-700">💳 결제 및 할인 적용 (단일 선택)</div>
        {#if isLocked && discountRowIndex !== -1}
          <button on:click={cancelDiscount} class="text-xs px-3 py-1 bg-red-600 text-white rounded font-bold animate-pulse hover:bg-red-700">
            ✕ 할인 취소하기
          </button>
        {/if}
      </div>
      
      <div class="flex gap-2 flex-wrap">
        {#if !isLocked || discountRowIndex === -1}
          <!-- JSON 데이터를 순회하며 동적으로 버튼 생성 -->
          {#each discountPolicies.dunkin as policy}
            <button 
              on:click={() => handleDiscountClick(policy)}
              class="px-3 py-1.5 border text-sm font-medium rounded transition-colors {policy.buttonColor}"
            >
              {policy.name}
            </button>
          {/each}
        {:else}
          <div class="text-sm text-red-500 font-medium py-1.5">
            🔒 할인이 적용되어 폼이 잠겼습니다. 품목 추가나 다른 할인을 원하시면 먼저 취소해주세요.
          </div>
        {/if}
      </div>
    </div>
  </div>

<!-- 문서 본문 -->
<DocumentForm
  type={currentType}
  bind:year
  bind:month
  bind:day
  bind:supplier
  bind:customer
  bind:items
  bind:bottomRemark
  bind:stampImg
  {isLocked}
  {discountRowIndex}
  {roundingRowIndex}
/>
