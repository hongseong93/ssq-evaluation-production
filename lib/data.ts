import { Assignment, Criterion, Judge, ScoreEntry, Submission } from "./types";

export const divisionLabels = {
  template: "Template Creation",
  original: "Original Creation",
  all: "전체"
} as const;

export const submissions: Submission[] = [
  {
    id: "s-001",
    receiptNumber: "SSQ-T-001",
    division: "template",
    artistName: "김하린",
    artworkTitle: "창조의 결",
    videoTitle: "The First Pattern",
    concept: "세종의 창제 정신을 한글 획의 움직임과 빛의 겹으로 재해석한 미디어파사드 작품.",
    description: "제공된 문화유산 템플릿을 기반으로 대형 외벽에서 읽히는 리듬과 여백을 강조했다.",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80",
    createdAt: "2026-07-01"
  },
  {
    id: "s-002",
    receiptNumber: "SSQ-O-014",
    division: "original",
    artistName: "박도윤",
    artworkTitle: "훈민의 빛",
    videoTitle: "Light for Everyone",
    concept: "문자의 민주성과 공공성을 빛의 파동으로 확장한 오리지널 창작 영상.",
    description: "도심 야간 환경에서 멀리서도 인지되는 색면과 움직임을 중심으로 구성했다.",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80",
    createdAt: "2026-07-03"
  },
  {
    id: "s-003",
    receiptNumber: "SSQ-T-027",
    division: "template",
    artistName: "이서연",
    artworkTitle: "왕의 정원",
    videoTitle: "Garden of Letters",
    concept: "궁중 문양과 한글 조형을 결합해 계절처럼 변화하는 창조의 시작을 표현.",
    description: "템플릿 자산의 패턴을 유지하면서 장면 전환과 깊이감을 강화했다.",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80",
    createdAt: "2026-07-04"
  },
  {
    id: "s-004",
    receiptNumber: "SSQ-O-031",
    division: "original",
    artistName: "최민준",
    artworkTitle: "발명된 하늘",
    videoTitle: "Invented Sky",
    concept: "해시계와 천문 관측의 이미지를 추상 모션 그래픽으로 연결한 작품.",
    description: "세종 시대 과학 기술의 질서를 현대적 화면 분할과 사운드 반응형 모션으로 풀었다.",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=900&q=80",
    createdAt: "2026-07-05"
  }
];

export const judges: Judge[] = [
  { id: "j-001", name: "홍길동", email: "hong@jury.kr", organization: "서울미디어랩", position: "디렉터", phone: "010-1111-2222", division: "all", isActive: true, lastSeen: "2026-07-08 14:12" },
  { id: "j-002", name: "김민지", email: "minji@jury.kr", organization: "아트센터", position: "큐레이터", phone: "010-3333-4444", division: "template", isActive: true, lastSeen: "2026-07-08 13:49" },
  { id: "j-003", name: "정우석", email: "wooseok@jury.kr", organization: "디지털아트스쿨", position: "교수", phone: "010-5555-6666", division: "original", isActive: false, lastSeen: "2026-07-07 18:20" }
];

export const criteria: Criterion[] = [
  { id: "ct-1", division: "template", title: "주제 적합성", maxScore: 25, description: "공모 주제인 대왕 세종, 창조의 시작을 작품 안에서 얼마나 명확하게 반영했는가", order: 1, questions: ["주제를 명확하게 반영하고 있는가", "문화유산의 의미를 적절하게 활용했는가", "역사적 소재를 현대적으로 표현했는가"] },
  { id: "ct-2", division: "template", title: "창의성 및 독창성", maxScore: 25, description: "제공된 유산 자산과 템플릿을 독창적으로 재해석했는가", order: 2, questions: ["템플릿을 단순 활용 이상으로 확장했는가", "시각 언어가 신선한가"] },
  { id: "ct-3", division: "template", title: "작품 완성도", maxScore: 20, description: "영상의 구성, 모션, 색감, 전환, 사운드 완성도가 높은가", order: 3, questions: ["장면 구성이 안정적인가", "모션과 색감의 품질이 높은가"] },
  { id: "ct-4", division: "template", title: "미디어파사드 적합성", maxScore: 20, description: "대형 미디어파사드 환경에 적합한 화면 구성과 연출을 갖추었는가", order: 4, questions: ["원거리 시인성이 좋은가", "대형 화면에서 임팩트가 있는가"] },
  { id: "ct-5", division: "template", title: "최종 제작 가능성", maxScore: 10, description: "최종 송출 규격으로 제작 및 보완이 가능한가", order: 5, questions: ["송출 규격 대응 가능성이 높은가"] },
  { id: "co-1", division: "original", title: "주제 해석력", maxScore: 25, description: "주제를 작가만의 관점으로 설득력 있게 해석했는가", order: 1, questions: ["주제 해석이 분명한가", "작가의 관점이 설득력 있는가"] },
  { id: "co-2", division: "original", title: "창의성 및 예술성", maxScore: 25, description: "시각적 독창성, 미디어아트 표현력, 예술적 완성도가 뛰어난가", order: 2, questions: ["시각적 독창성이 높은가", "예술적 완성도가 높은가"] },
  { id: "co-3", division: "original", title: "작품 완성도", maxScore: 20, description: "영상의 구성, 흐름, 장면 연출, 색감, 모션, 사운드가 안정적인가", order: 3, questions: ["전체 흐름이 안정적인가", "영상 품질이 완성도 있게 정리되었는가"] },
  { id: "co-4", division: "original", title: "미디어파사드 적합성", maxScore: 20, description: "대형 옥외 미디어파사드에서 시각적 임팩트와 공공성을 확보할 수 있는가", order: 4, questions: ["공공 공간과 잘 맞는가", "대형 화면 임팩트가 충분한가"] },
  { id: "co-5", division: "original", title: "최종 제작 가능성", maxScore: 10, description: "최종본 제작, 해상도 확장, 송출 규격 대응이 가능한가", order: 5, questions: ["기술적 보완 가능성이 높은가"] }
];

export const assignments: Assignment[] = [
  { judgeId: "j-001", submissionId: "s-001", status: "completed", updatedAt: "2026-07-08 13:20" },
  { judgeId: "j-001", submissionId: "s-002", status: "draft", updatedAt: "2026-07-08 14:05" },
  { judgeId: "j-001", submissionId: "s-003", status: "not_started", updatedAt: "2026-07-08 11:20" },
  { judgeId: "j-001", submissionId: "s-004", status: "submitted", updatedAt: "2026-07-08 12:10" },
  { judgeId: "j-002", submissionId: "s-001", status: "submitted", updatedAt: "2026-07-08 13:49" },
  { judgeId: "j-002", submissionId: "s-003", status: "completed", updatedAt: "2026-07-08 12:31" },
  { judgeId: "j-003", submissionId: "s-002", status: "draft", updatedAt: "2026-07-07 18:20" },
  { judgeId: "j-003", submissionId: "s-004", status: "not_started", updatedAt: "2026-07-07 17:10" }
];

export const scores: ScoreEntry[] = [
  { judgeId: "j-001", submissionId: "s-001", criterionId: "ct-1", questionScores: [4, 5, 4], note: "주제 반영이 안정적이고 화면 전환이 명확합니다." },
  { judgeId: "j-001", submissionId: "s-001", criterionId: "ct-2", questionScores: [4, 4], note: "" },
  { judgeId: "j-001", submissionId: "s-001", criterionId: "ct-3", questionScores: [5, 4], note: "완성도가 높습니다." },
  { judgeId: "j-001", submissionId: "s-001", criterionId: "ct-4", questionScores: [4, 4], note: "" },
  { judgeId: "j-001", submissionId: "s-001", criterionId: "ct-5", questionScores: [5], note: "" },
  { judgeId: "j-002", submissionId: "s-001", criterionId: "ct-1", questionScores: [5, 4, 4], note: "문화유산 활용이 좋습니다." },
  { judgeId: "j-002", submissionId: "s-001", criterionId: "ct-2", questionScores: [4, 3], note: "" },
  { judgeId: "j-002", submissionId: "s-001", criterionId: "ct-3", questionScores: [4, 4], note: "" },
  { judgeId: "j-002", submissionId: "s-001", criterionId: "ct-4", questionScores: [4, 5], note: "" },
  { judgeId: "j-002", submissionId: "s-001", criterionId: "ct-5", questionScores: [4], note: "" },
  { judgeId: "j-001", submissionId: "s-004", criterionId: "co-1", questionScores: [5, 5], note: "해석이 선명합니다." },
  { judgeId: "j-001", submissionId: "s-004", criterionId: "co-2", questionScores: [5, 4], note: "" },
  { judgeId: "j-001", submissionId: "s-004", criterionId: "co-3", questionScores: [4, 4], note: "" },
  { judgeId: "j-001", submissionId: "s-004", criterionId: "co-4", questionScores: [5, 4], note: "" },
  { judgeId: "j-001", submissionId: "s-004", criterionId: "co-5", questionScores: [4], note: "" }
];

