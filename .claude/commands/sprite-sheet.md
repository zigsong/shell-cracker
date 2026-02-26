스프라이트 시트 작업을 도와줘: $ARGUMENTS

## 현재 스프라이트 시트 현황

### `sprite_success.png` (2×2 그리드)
- 원본 크기: 1280×669px → 표시 크기: 640×335px
- 프레임 크기: 320×167px
- `background-size: 640px 335px`

| 프레임 인덱스 | background-position | 내용 |
|-------------|--------------------|----|
| 0 | `0px 0px` | 기본 (조개 들고 있는 모습) |
| 1 | `-320px 0px` | HIT |
| 2 | `0px -167px` | CRACK! |
| 3 | `-320px -167px` | 기뻐하는 모습 |

### `sprite_miss.png` (2×1 그리드)
- 원본 크기: 1280×669px → 표시 크기: 640×335px
- 프레임 크기: 320×335px
- `background-size: 640px 335px`

| 프레임 인덱스 | background-position | 내용 |
|-------------|--------------------|----|
| 0 | `30px 0px` | 슬퍼하는 모습 |
| 1 | `-290px 0px` | MISS! |

### `shell_types.png` (3×1 그리드)
- 프레임 크기: 100×140px
- `background-size: 300px 140px`

| 상태 | background-position | CSS 클래스 |
|------|--------------------|----|
| 기본 | `0px 0px` | (없음) |
| 열림 | `-100px 0px` | `.opened` |
| 깨짐 | `-200px 0px` | `.broken` |

---

## 새 스프라이트 추가 시 계산 공식

이미지가 **N열 × M행** 그리드일 때:
- `background-size`: `(원본너비 × 표시배율)px (원본높이 × 표시배율)px`
- 프레임 `(col, row)`의 `background-position`: `-(col × 프레임너비)px -(row × 프레임높이)px`

---

$ARGUMENTS 에 맞게 작업해줘.
인자가 없으면 현재 스프라이트 시트 현황과 좌표 계산 방법을 설명해줘.
