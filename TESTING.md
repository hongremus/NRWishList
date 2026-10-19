# NR Wish List 測試指南

> 呢份文件係之後每次 update NR Wish List 都要跟嘅測試流程。
> 目標係先確保功能冇整壞，再用 coverage 睇測試覆蓋範圍，最後用 mutation testing 檢查測試係咪真係捉到錯誤。
>
> **目前狀態註解：** repo 暫時未有正式 test script、coverage script 或 mutation testing script。以下先定義標準流程同驗收要求；工具真正加入 package.json 後，要同步更新本文件嘅「執行指令」部分。

## 1. 三種測試有咩分別

### 回歸測試（Regression Test）

用來確認今次修改冇整壞原本已經正常嘅功能。

例子：

- 改 House Rules approval flow 後，仍然可以新增、確認、取消同拒絕家規提案。
- 改 Crime Records status 後，仍然可以新增案件、由對方確認，以及同步 realtime update。
- 改 Calendar 後，願望清單、Random Date、登入同現有日曆功能仍然正常。

**人類易明版：** 之前做到嘅嘢，今次改完之後都要再行一次，確定冇倒退。

### Coverage

Coverage 係量度測試執行過幾多程式碼，通常會睇：

- **Statements：** 有幾多行／statement 真係行過。
- **Branches：** `if`、條件判斷、成功／失敗分支有冇行過。
- **Functions：** 有幾多 function 被測試呼叫過。
- **Lines：** 有幾多 source line 被測試執行過。

Coverage 高唔代表一定冇 bug。只行過一行 code，但冇檢查結果，都可以係「假 coverage」。對呢個 app，Branches 同測試 assertion 比單純追求百分比更重要。

### Mutation Testing

Mutation testing 會刻意將 source code 做細小破壞，例如：

- 將 `===` 改成 `!==`。
- 將 `true` 改成 `false`。
- 移除一個條件。
- 將回傳值改錯。

之後再行 test：

- **Killed：** 測試成功捉到個人為錯誤，代表測試有保護力。
- **Survived：** 測試冇捉到個人為錯誤，要檢查係漏咗 test，定係 mutation 本身唔影響行為。
- **No coverage：** 個位置根本冇測試行到，優先補 test。

**人類易明版：** 唔係問「有冇行過呢行 code」，而係問「如果呢行 code 壞咗，測試捉唔捉到」。

## 2. 每次 update 必做流程

### 純文字改動可以用簡化流程

如果今次只係改以下內容：

- button／heading／placeholder／error message 文字。
- README、release note 或其他文件文字。
- 不涉及條件判斷、state、data mapping、API、CSS layout 或 touch behavior。

就唔需要特別跑完整 coverage 或 mutation testing。做以下簡單檢查已經足夠：

```powershell
npm.cmd run build
git diff --check
```

再喺受影響畫面快速確認：

- 新文字顯示正確，冇 typo 或被截斷。
- button／label 仍然喺正確位置，冇超出容器。
- 如果係 user-facing text，最少用 desktop 或手機其中一個 viewport 睇一次。

註解：如果表面上係改文字，但同時改咗 render condition、component state、className、modal、touch 或 API 行為，就唔再當純文字改動，要跟完整 regression 流程。

### Step 1：先記低今次改動範圍

喺開始測試前，列出：

- 改咗邊個 page、component、hook 或 store action。
- 改動影響邊個使用者流程。
- 有冇涉及 Supabase、Realtime、權限、手機版或 iOS 行為。
- 有冇需要手動測試嘅外部依賴，例如真實 Supabase data。

### Step 2：行基本 validation

```powershell
npm.cmd run build
git diff --check
```

註解：`build` 主要捉 TypeScript、import、JSX 同 bundling 問題；`git diff --check` 捉 whitespace 錯誤。兩者都通過，唔代表功能測試已通過。

### Step 3：行受影響功能嘅回歸測試

先測改動直接影響嘅 flow，再測相鄰 flow。

建議次序：

1. 正常成功流程。
2. 取消、拒絕、空值、重覆提交等邊界流程。
3. 網絡／Supabase error 後再試。
4. Realtime 收到對方更新後嘅畫面及按鈕狀態。
5. Mobile，尤其 iOS Safari；涉及 fixed、modal、scroll 或 touch 時一定要實機測。
6. 再行一次不相關但共用同一 store／component 嘅舊功能。

### Step 4：行 automated test 同 coverage

當 test runner 加入 repo 後，標準指令應該包括：

```powershell
npm.cmd run test
npm.cmd run test:coverage
```

Coverage report 最少要檢查：

- 有冇 test fail。
- Branches 是否覆蓋成功、失敗、權限拒絕及空資料分支。
- 新增或修改嘅 store action 是否有直接測試。
- report 入面嘅 uncovered lines 是否合理，而唔係只睇總百分比。

**建議最低要求：** 新增或修改嘅核心 business logic 要有 automated test；UI-only 文字／className 改動可以用 component test 或手動 regression test，但要喺 PR／commit note 寫清楚理由。

### Step 5：行 mutation testing

當 mutation runner 加入 repo 後：

```powershell
npm.cmd run test:mutation
```

重點唔係一開始追求 100% mutation score，而係：

- 先處理新改動附近嘅 `Survived` mutants。
- `No coverage` 優先補 test。
- 確認 survived mutant 係 equivalent mutant（改咗但實際行為相同）先可以記錄並略過。
- 唔好為咗提高分數加入只測 implementation details、冇驗證使用者行為嘅脆弱 test。

## 3. House Rules／Crime Records 回歸清單

每次改到家規、犯罪紀錄、approval、status 或 realtime，都要行以下清單。

### 家規

- [ ] 新增空白家規前，表單行為正確。
- [ ] 提交家規修改後，自己見到「等對方確認」。
- [ ] 自己提交嘅提案按鈕顯示「取消」，按下後會取消提案。
- [ ] 對方提交嘅提案按鈕顯示「拒絕」，按下後會拒絕提案。
- [ ] 對方確認後家規內容正式更新。
- [ ] Realtime 更新後，確認／拒絕按鈕仍然可以撳。

### 犯罪紀錄

- [ ] 新增案件會由對方作為犯案人，自己唔可以揀自己。
- [ ] 新案件由對方確認後先加入已確認紀錄。
- [ ] 自己提交嘅待確認案件顯示「取消」；對方提交嘅案件顯示「拒絕」。
- [ ] 建立者提出 status／懲罰修改後，對方可以確認或拒絕。
- [ ] status 由「未處理」改做「錫返了」時，儲存前會彈確認。
- [ ] 取消「錫返了」確認後，唔會建立修改提案。
- [ ] 確認「錫返了」後，先會建立修改提案並等對方確認。
- [ ] 正式變成「錫返了」後，唔再顯示「提出修改」。
- [ ] 已經係「錫返了」嘅紀錄，store action 亦拒絕再次修改 status／懲罰。
- [ ] 「其他事件」提交唔會插入 null `rule_text` 造成 Supabase error。

## 4. Mobile／iOS 必測項目

涉及以下改動時，Android browser 通過唔足夠，最少要用一部 iPhone 實機測：

- [ ] Realtime 更新畫面後直接撳主要 action button。
- [ ] Modal 開關後再撳底層頁面按鈕。
- [ ] 頁面切換後返到原本 tab，再撳 action button。
- [ ] 長頁面滾動後開 modal，再取消或確認。
- [ ] 鍵盤開啟／收起後按 submit。
- [ ] portrait／landscape 轉換後按鈕位置及 touch area 正常。
- [ ] Safari back-forward cache 返回頁面後，按鈕仍然可用。
- [ ] 每次新增或修改 date picker／time picker，都要用 iPhone 實機開啟一次，確認原生控件冇超出 modal 或 viewport。
- [ ] date／time picker 要測試開啟、改值、取消、確認，以及關閉 modal 後再次開啟；特別檢查右邊界、橫向滾動同 portrait／landscape。
- [ ] 表單內嘅 date／time input 必須有 `min-width: 0`、`max-width: 100%`、`box-sizing: border-box`；如 iOS 原生 appearance 撐闊控件，要加瀏覽器專用 appearance override，並重新測試 picker 仍然可以正常開啟。
- [ ] 唔好只用 desktop／Android browser 判斷 picker layout 正常；iOS Safari 原生 date／time control 嘅 intrinsic width 可以同其他 browser 唔同。

測試時要記錄：iOS 版本、Safari 版本、裝置、網絡、production 或 UAT URL，以及係首次載入定係 realtime update 後出現問題。

## 5. 建議 test 分層

| 層級 | 主要測試內容 | 適合捉咩問題 |
| --- | --- | --- |
| Store／unit | proposal、permission、status lock、error handling | business rule、邊界條件、資料轉換 |
| Component | button label、modal、disabled／hidden state | UI 狀態同使用者操作 |
| Integration | component + Zustand + mocked Supabase | UI 同 store 接駁錯誤 |
| Manual device | iOS／Android、Realtime、scroll、touch | 真實 browser／裝置問題 |
| Mutation | 刻意改壞條件及分支 | 測試本身有冇保護力 |

註解：唔需要所有嘢都用 end-to-end test。核心規則放喺 store／unit test，UI 狀態用 component test，真實 Supabase Realtime 同 iOS touch 就用 integration／manual device test 互補。

## 6. Test report 範本

每次 release 或較大 update，可以用以下格式記錄：

```text
版本／commit：
測試日期：
測試環境：UAT / Production
瀏覽器／裝置：

Build：PASS / FAIL
Automated regression：PASS / FAIL
Coverage：Statements __% / Branches __% / Functions __% / Lines __%
Mutation：Killed __ / Survived __ / No coverage __
Manual iOS：PASS / FAIL / N/A
Manual Android：PASS / FAIL / N/A

失敗項目：
- 

已知風險／未測部分：
- 
```

## 7. 更新程式後要同步更新呢份文件

以下情況，必須修改 `TESTING.md`：

- 新增一個主要 user flow。
- 更改 approval、permission、status 或 data sync 規則。
- 新增／移除 test command 或 test framework。
- 新增一個會影響 iOS／Android 行為嘅 component、hook 或 CSS pattern。
- Regression checklist 有新案例，或者舊案例已經唔適用。
- Coverage／mutation threshold 改變。

**最終原則：** 每次 update 唔只係測「今次改嗰行」，而係要測「使用者原本做到嘅嘢仍然做到」。Coverage 用來找盲點，mutation testing 用來驗證測試有冇真正保護力，manual device testing 用來補足真實瀏覽器同 Realtime 行為。
