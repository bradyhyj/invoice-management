<script>
  // @ts-nocheck <- 타입 검사 중지
  // 만든 공통 컴포넌트 불러오기
  import DocumentForm from "./components/DocumentForm.svelte";

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
  let items = Array(15)
    .fill()
    .map(() => ({
      name: "",
      spec: "",
      qty: "",
      price: "",
      amount: "",
      note: "",
    }));
  items[0] = {
    name: "버라이어티팩(6개입)",
    spec: "EA",
    qty: 8,
    price: 12200,
    amount: "",
    note: "",
  };

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

<!-- 💡 핵심: 템플릿 컴포넌트에 모든 데이터를 묶어서(bind) 넘겨줌 -->
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
/>
