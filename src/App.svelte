<script>
  // @ts-nocheck <- 타입 검사 중지

  // 명세서 작성일
  const now = new Date();
  let year = String(now.getFullYear());
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");

  // 공급자 정보
  let supplier = {
    bizNum: "123-45-67890",
    name: "엄마네 가게 상호",
    boss: "홍길동",
    address: "부산광역시 OO구 OO로 123",
    category: "음식",
    type: "도너츠, 음료",
    tel: "051-123-4567",
  };

  // 거래처 정보
  let customer = {
    name: "",
  };

  // 하단 비고란
  let bottomRemark = "";

  // isLocked가 실시간으로 변하도록 $: (반응형) 복구
  let appliedDiscountIndex = -1;
  let appliedRoundingIndex = -1;
  $: isLocked = appliedDiscountIndex !== -1 || appliedRoundingIndex !== -1;

  // 15칸 빈칸 배열 생성
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

  // 첫 번째 칸 초기값
  items[0] = {
    name: "버라이어티팩(6개입)",
    spec: "EA",
    qty: 8,
    price: 12200,
    amount: "",
    note: "",
  };

  // 행 내용 지우기
  function clearItem(index) {
    items[index] = {
      name: "",
      spec: "",
      qty: "",
      price: "",
      amount: "",
      note: "",
    };
    items = items;
  }

  $: {
    items.forEach((item) => {
      const hasQty = item.qty !== "" && item.qty !== null;
      const hasPrice = item.price !== "" && item.price !== null;
      if (hasQty && hasPrice) {
        item.amount = Number(item.qty) * Number(item.price);
      }
    });
  }

  function lineAmount(item) {
    return item.amount === "" || item.amount === null ? 0 : Number(item.amount);
  }

  // 실시간 합계 계산
  $: total = items.reduce((sum, item) => sum + lineAmount(item), 0);

  function numberToKorean(num) {
    const isNeg = num < 0;
    num = Math.abs(num);
    if (num === 0) return "영";
    const textArr = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    const unitArr = ["", "십", "백", "천"];
    const scaleArr = ["", "만", "억", "조", "경"];
    let result = "";
    let numStr = String(num);
    let len = numStr.length;
    for (let i = 0; i < len; i++) {
      let n = parseInt(numStr.charAt(i));
      let u = (len - i - 1) % 4;
      let s = Math.floor((len - i - 1) / 4);
      if (n !== 0) result += textArr[n] + unitArr[u];
      if (
        u === 0 &&
        numStr.substring(len - (s + 1) * 4, len - s * 4) !== "0000"
      )
        result += scaleArr[s];
    }
    return (isNeg ? "마이너스 " : "") + result;
  }

  $: totalKorean = numberToKorean(total);

  function handlePrint() {
    window.print();
  }
</script>

<div
  class="min-h-screen bg-slate-50 p-6 text-slate-800 print:p-0 print:bg-white"
>
  <div class="max-w-4xl mx-auto print:m-0">
    <!-- 상단 툴바 -->
    <div class="flex justify-between items-center mb-6 print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">거래명세서 작성기</h1>
        <p class="text-sm text-slate-500 mt-1">
          입력한 내용 그대로 PDF/인쇄로 출력됩니다
        </p>
      </div>
      <div class="flex gap-2">
        <button
          on:click={handlePrint}
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          인쇄 / PDF 저장
        </button>
      </div>
    </div>

    <!-- 명세서 본문 (A4 규격) -->
    <div
      class="bg-white p-8 mx-auto w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:p-6 print:m-0 box-border flex flex-col rounded-sm print:rounded-none overflow-hidden print:min-h-0 print:h-[297mm] invoice-font"
    >
      <!-- 상단 헤더 (제목 & 문서번호) -->
      <div class="flex justify-between items-end mb-3">
        <div class="w-32"></div>

        <div class="text-center flex-1 pt-2">
          <h2
            class="text-[26px] font-bold tracking-[0.45em] text-black inline-block border-b-4 border-double border-black pb-1 px-2"
          >
            거 래 명 세 서
          </h2>
        </div>

        <div class="text-right text-sm w-32 pb-1 pr-2">
          <span class="italic underline underline-offset-4 text-slate-700"
            >No.</span
          >
          <input
            type="text"
            placeholder="2026-001"
            class="w-20 outline-none text-right bg-transparent border-b border-dashed border-slate-400 print:placeholder-transparent"
          />
        </div>
      </div>

      <!-- 상단 정보 영역 (좌/우 분할) -->
      <div class="flex justify-between items-end mb-4 text-sm">
        <!-- 왼쪽: 공급받는 자 영역 -->
        <div class="flex-1 pr-8 flex flex-col justify-end gap-4 pb-1">
          <div
            class="border-b border-black pb-1 w-[75%] flex items-end justify-start text-slate-800"
          >
            <input
              type="text"
              bind:value={year}
              class="w-12 text-right outline-none bg-transparent"
            /><span>년</span>
            <input
              type="text"
              bind:value={month}
              class="w-7 text-right outline-none bg-transparent"
            /><span>월</span>
            <input
              type="text"
              bind:value={day}
              class="w-7 text-right outline-none bg-transparent"
            /><span>일</span>
          </div>

          <div class="flex items-end w-full">
            <div class="border-b border-black pb-1 w-[80%]">
              <input
                type="text"
                bind:value={customer.name}
                class="w-full text-center outline-none bg-transparent text-slate-800"
                placeholder="부산광역시청"
              />
            </div>
            <span class="text-[15px] mb-1 whitespace-nowrap text-black ml-3"
              >귀하</span
            >
          </div>

          <div class="text-sm text-black mt-1">아래 물품을 거래합니다.</div>
        </div>

        <!-- 오른쪽: 공급자 표 -->
        <div class="flex-shrink-0">
          <table
            class="w-[360px] border-collapse border-2 border-black text-sm text-center bg-white table-fixed"
          >
            <tbody>
              <tr>
                <td
                  rowspan="5"
                  class="border border-black w-7 text-xs leading-loose"
                  >공<br /><br />급<br /><br />자</td
                >
                <td
                  class="border border-black w-20 py-1 text-xs tracking-[0.2em]"
                  >등 록 번 호</td
                >
                <td colspan="3" class="border border-black">
                  <input
                    type="text"
                    bind:value={supplier.bizNum}
                    class="w-full text-center outline-none font-bold tracking-widest"
                  />
                </td>
              </tr>
              <tr>
                <td class="border border-black py-1 text-[11px] tracking-tight"
                  >상호(법인명)</td
                >
                <td class="border border-black w-32">
                  <input
                    type="text"
                    bind:value={supplier.name}
                    class="w-full text-center outline-none"
                  />
                </td>
                <td
                  class="border border-black w-10 text-[11px] tracking-[0.2em]"
                  >성 명</td
                >
                <td class="border border-black">
                  <input
                    type="text"
                    bind:value={supplier.boss}
                    class="w-full text-center outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td
                  class="border border-black py-1 text-[11px] tracking-[0.1em]"
                  >사 업 장 주 소</td
                >
                <td colspan="3" class="border border-black">
                  <input
                    type="text"
                    bind:value={supplier.address}
                    class="w-full text-center outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td
                  class="border border-black py-1 text-[11px] tracking-[0.5em]"
                  >업 태</td
                >
                <td class="border border-black">
                  <input
                    type="text"
                    bind:value={supplier.category}
                    class="w-full text-center outline-none text-xs"
                  />
                </td>
                <td class="border border-black text-[11px] tracking-[0.5em]"
                  >종 목</td
                >
                <td class="border border-black">
                  <input
                    type="text"
                    bind:value={supplier.type}
                    class="w-full text-center outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td
                  class="border border-black py-1 text-[11px] tracking-[0.2em]"
                  >전 화 번 호</td
                >
                <td colspan="3" class="border border-black">
                  <input
                    type="text"
                    bind:value={supplier.tel}
                    class="w-full text-center outline-none text-xs tracking-widest"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 품목 테이블 -->
      <div class="flex-1 flex flex-col justify-between">
        <table
          class="w-full text-center border-collapse text-sm border-2 border-black table-fixed"
        >
          <colgroup>
            <col class="w-[28%]" />
            <col class="w-[10%]" />
            <col class="w-[8%]" />
            <col class="w-[12%]" />
            <col class="w-[15%]" />
            <col class="w-[19%] print:w-[27%]" />
            <col class="w-[8%] print:hidden" />
          </colgroup>
          <thead>
            <tr>
              <th
                colspan="2"
                class="border border-black border-b-2 py-2 px-2 text-center bg-gray-200"
              >
                <div class="tracking-[0.2em] font-bold text-[14px]">
                  합 계 금 액
                </div>
                <div class="text-[10px] font-normal text-slate-700">
                  (공급가액+세액)
                </div>
              </th>
              <th
                colspan="4"
                class="border border-black border-b-2 py-2 px-2 text-center text-[15px] bg-white"
              >
                일금 {totalKorean}원整
                <span class="font-bold ml-2"
                  >(₩{total !== 0 ? total.toLocaleString() : "0"})</span
                >
              </th>
              <th
                class="print:hidden border border-black border-b-2 bg-white w-10"
              ></th>
            </tr>
            <tr class="bg-gray-300 text-center text-black font-normal">
              <th
                class="border border-black py-2 px-1 tracking-widest font-normal whitespace-nowrap"
                >품 명</th
              >
              <th
                class="border border-black py-2 px-1 tracking-widest font-normal whitespace-nowrap"
                >규 격</th
              >
              <th
                class="border border-black py-2 px-1 tracking-widest font-normal whitespace-nowrap"
                >수 량</th
              >
              <th
                class="border border-black py-2 px-1 tracking-widest font-normal whitespace-nowrap"
                >단 가</th
              >
              <th
                class="border border-black py-2 px-1 tracking-widest font-normal whitespace-nowrap"
                >금 액</th
              >
              <th
                class="border border-black py-2 px-1 tracking-widest font-normal whitespace-nowrap"
                >비 고</th
              >
              <th
                class="border border-black py-2 px-1 print:hidden text-xs font-normal whitespace-nowrap"
                >삭제</th
              >
            </tr>
          </thead>

          <tbody>
            {#each items as item, i}
              <tr
                class={i === appliedDiscountIndex || i === appliedRoundingIndex
                  ? "text-red-600 bg-red-50/30"
                  : ""}
              >
                <td class="border border-black px-1 py-1 align-middle">
                  <textarea
                    bind:value={item.name}
                    disabled={isLocked}
                    rows="1"
                    class="cell-input w-full min-h-[24px] outline-none bg-transparent text-center resize-none disabled:bg-transparent"
                  ></textarea>
                </td>
                <td class="border border-black px-1 h-[29px]">
                  <input
                    type="text"
                    bind:value={item.spec}
                    disabled={isLocked}
                    class="w-full h-full outline-none bg-transparent text-center disabled:bg-transparent"
                  />
                </td>
                <td class="border border-black px-1 h-[29px]">
                  <input
                    type="number"
                    bind:value={item.qty}
                    disabled={isLocked}
                    class="w-full h-full outline-none bg-transparent text-center disabled:bg-transparent"
                  />
                </td>
                <td class="border border-black px-1 h-[29px]">
                  <input
                    type="number"
                    bind:value={item.price}
                    step="100"
                    disabled={isLocked}
                    class="w-full h-full outline-none bg-transparent text-right disabled:bg-transparent"
                  />
                </td>
                <td class="border border-black px-1 h-[29px]">
                  <input
                    type="number"
                    bind:value={item.amount}
                    disabled={isLocked}
                    placeholder={item.qty && item.price
                      ? String(Number(item.qty) * Number(item.price))
                      : ""}
                    class="w-full h-full outline-none bg-transparent text-right font-medium disabled:bg-transparent"
                  />
                </td>
                <td class="border border-black px-1 h-[29px]">
                  <input
                    type="text"
                    bind:value={item.note}
                    disabled={isLocked}
                    class="w-full h-full outline-none bg-transparent text-center text-xs disabled:bg-transparent"
                  />
                </td>
                <td
                  class="border border-black px-1 h-[29px] text-center print:hidden"
                >
                  <button
                    on:click={() => clearItem(i)}
                    class="text-slate-300 hover:text-red-500 font-bold text-xs"
                    >✕</button
                  >
                </td>
              </tr>
            {/each}
          </tbody>

          <tfoot>
            <tr
              class="bg-gray-300 font-bold text-black border-y-2 border-black"
            >
              <td
                colspan="4"
                class="border border-black py-2.5 text-center tracking-[2em] pl-8 text-sm"
                >합 계</td
              >
              <td class="border border-black py-2.5 px-2 text-right text-base"
                >{total !== 0 ? total.toLocaleString() : ""}</td
              >
              <td class="border border-black py-2.5 bg-gray-300"></td>
              <td class="border border-black py-2.5 bg-gray-300 print:hidden"
              ></td>
            </tr>
            <tr class="bg-white">
              <td colspan="6" class="border border-black py-6 px-4">
                <textarea
                  bind:value={bottomRemark}
                  placeholder="카드 승인일자: 2026-02-04&#10;카드 승인번호: 76455339&#10;카드 결제금액: 83,760원"
                  class="w-full h-[74px] overflow-hidden outline-none resize-none bg-transparent text-center text-sm leading-relaxed text-slate-500 font-medium print:placeholder-transparent"
                ></textarea>
              </td>
              <td class="border border-black print:hidden"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</div>