export const discountPolicies = {
  // 던킨 할인 정책
  dunkin: [
    {
      id: "skt_t",
      name: "SKT T멤버십",
      buttonColor: "bg-red-50 text-red-700",
      type: "PERCENT_TIER", // 등급별 퍼센트 할인
      tiers: { SILVER: 0.05, GOLD: 0.15, VIP: 0.15 },
      maxLimits: { SILVER: 10000, GOLD: 30000, VIP: 30000 },
      requiresItemSelection: true, // 💡 팝업에서 품목 선택이 필요한가? -> O
      warningMessage: "제조 커피와 도넛에 한하여 적용됩니다. (베이글 등 베이커리 디저트 카테고리와 커피 상품(병, 캔, 팩 음료 포함)은 혜택 대상에서 제외되며, 콤보/세트 메뉴 및 다른 쿠폰, 이벤트/할인과 중복 적용하실 수 없습니다.)",
    },

    {
      id: "hyundai_m",
      name: "현대 M포인트",
      buttonColor: "bg-blue-50 text-blue-700",
      type: "POINT_INPUT", // 고객이 직접 포인트를 입력하는 방식
      minUsage: 1000, // 최소 1000원 이상부터
      maxUsagePercent: 30, // 전액 결제 가능 여부
      requiresItemSelection: false, // 💡 품목 선택 없이 총액에서 바로 깎는가? -> O
      warningMessage: "고객님께 현재 포인트가 얼마나 있는지를 확인해주세요.",
    },

    {
      id: "blue_members",
      name: "블루멤버스",
      buttonColor: "bg-blue-50 text-blue-700",
      type: "POINT_INPUT",
      minUsage: 1000, // 최소 1000원 이상부터
      maxUsagePercent: 50, // 전액 결제 가능 여부
      requiresItemSelection: false, // 💡 품목 선택 없이 총액에서 바로 깎는가? -> O
      warningMessage: "고객님께 현재 포인트가 얼마나 있는지를 확인해주세요.",
    },

    {
      id: "kia_members",
      name: "기아멤버스",
      buttonColor: "bg-blue-50 text-blue-700",
      type: "POINT_INPUT",
      minUsage: 1000, // 최소 1000원 이상부터
      maxUsagePercent: 50, // 전액 결제 가능 여부
      requiresItemSelection: false, // 💡 품목 선택 없이 총액에서 바로 깎는가? -> O
      warningMessage: "고객님께 현재 포인트가 얼마나 있는지를 확인해주세요.",
    },

    {
      id: "skt_pass",
      name: "SKT 우주패스 핫픽",
      buttonColor: "bg-red-50 text-red-700",
      type: "PERCENT_OFF",
      rate: 0.2,
      maxLimit: 20000,
      requiresItemSelection: true, // 💡 팝업에서 품목 선택이 필요한가? -> O
      warningMessage: "제조 커피와 도넛에 한하여 적용됩니다. (베이글 등 베이커리 디저트 카테고리와 커피 및 음료 상품(병, 캔, 팩 음료 포함)은 혜택 대상에서 제외되며, 콤보/세트 메뉴 및 다른 쿠폰, 이벤트/할인과 중복 적용하실 수 없습니다.) 고객님께 월 한도가 2만원 이상 남았는지 확인이 필요합니다.",
    },

    {
      id: "custom",
      name: "임의할인",
      buttonColor: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300",
      type: "CUSTOM_MANUAL", 
      requiresItemSelection: false, // 품목 상관없이 총액에서 바로 차감
      warningMessage: "적용할 할인 금액이나 퍼센트(%)를 입력하세요.",
    }
  ],
  
  
};