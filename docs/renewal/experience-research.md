# 科学的な体験設計と検証計画

2026-10-14。以下は研究から導く設計仮説であり、本ゲームでの効果実証ではない。

|施策|根拠/範囲|実装|指標|結果|
|---|---|---|---|---|
|操作から予測できる変化|Schultz 2016: 予測と結果の差に関わるドーパミン信号。単一の快楽量ではない|接触によるコイン移動、塔の傾き、実衝突音。結果確定後に惜しい見せ方へ改ざんしない|予測した結果と実際の一致説明、納得感1–7|未測定|
|初心者の成功と練習|Ryan et al. 2006: ゲームにおける有能感・自律性などと楽しさの関係|無料補充、読みやすい初期ステージ、選択できる高難度、命中位置の正直な表示|初回成功までの時間、同条件3回で成功率改善、失敗理由の理解|未測定|
|自律性|同上。設計要素単独で効果を保証しない|1/3/5道具、標的・投入位置・ステージ選択、イベント手動再訪|戦略別選択率、選ぶ理由を説明できる割合|未測定|
|関係性/愛着|同上。ただし図鑑/キャラ愛着を対人的関係性と同一視しない|架空の夜店主と魚図鑑、個別記録、季節背景|愛着の自由回答、再訪意向。関係性充足は別質問|未測定|
|挑戦と技能|Harris et al. の複雑なモバイルゲーム研究。フローを速度の一変数で説明しない|難易度を自分で選ぶ。物理・確率を秘密に個人調整しない|主観難度と技能、短いフロー尺度、ストレス、達成感|未測定|
|Game Feel|本作への工学的仮説（効果未実証）|音は接触イベント、振動は対応端末のみ。演出を衝突強度/純成功に比例、低刺激設定|入力→描画遅延、音ずれ、標的遮蔽時間、操作納得感|未測定|

## 研究資料

- Ryan, Rigby & Przybylski (2006), *The Motivational Pull of Video Games: A Self-Determination Theory Approach*. https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf
- Schultz (2016), *Dopamine reward prediction-error signalling: a two-component response*. https://www.nature.com/articles/nrn.2015.26 / https://pmc.ncbi.nlm.nih.gov/articles/PMC5549862/
- *The relationship between the skill-challenge balance, game expertise, flow and the urge to keep playing complex mobile games*. https://pmc.ncbi.nlm.nih.gov/articles/PMC8943660/
- Tyack & Mekler (2024), *Self-Determination Theory and HCI Games Research: Unfulfilled Promises and Unquestioned Paradigms*. https://arxiv.org/abs/2405.12639 — SDTの浅い適用への注意。
- Rapier公式: https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ 、 https://rapier.rs/docs/user_guides/javascript/colliders/

## プレイテスト手順

まず5〜8人の形成的評価（統計的有効性証明ではない）。各台で同じ初期状態、練習後3セット。順序を入れ替え、投入条件を固定。初心者/標準/熟練は実ログからモデルを推定し、ユーザーへの秘密の難易度操作には使わない。

1. 操作説明を読まず開始し、迷い・最初の成功までの時間を観察。
2. 成功/失敗の直後、原因を本人の言葉で説明してもらう。
3. 各セット後に納得感・達成感・ストレス・再プレイ意向を1–7で回答。
4. 同条件での技能改善、道具による戦略差、端末別入力遅延を照合。
5. 継続時間が伸びてもストレスややめにくさが増えた施策は成功と認定しない。

実時間の締切、取り逃し通知、損失を勝利と偽る演出、作為的ニアミス、暗黙の残高連動確率は採用しない。セッション終了・中断・無料補充をいつでも選べる。健康やドーパミン分泌の数値効果は測定も主張もしない。
