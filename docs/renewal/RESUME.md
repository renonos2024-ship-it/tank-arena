# 続行用チェックポイント（2026-10-15）

原本branchは変更しない。作業branch `yoimachi-renewal-20261014`。

現状：Phase0レポート・現行射的90万発基準値。Phase1のThree/Rapierプッシャー、共通v2保存、3台残高接続、金魚図鑑保存、15自動テスト、ビルド、CI定義。

次の作業順：
1. 実ブラウザでプッシャーを描画しスクリーンショット/動画を取得。iPhoneで同時指、音、再開、30分を確認。ここは未検証。
2. プッシャーの投入上限/側面ロス/重い球の経済を調整し、明示的なボーナス供給を追加。115%はまだ達成していない。
3. 射的HP・未着弾弾・ステージを原子的保存。金魚のポイ/捕獲途中/魚群/図鑑を原子的保存。現在は射的進行保存なし、金魚は図鑑のみ。
4. 金魚の複数捕獲・持上げ過程、射的専用イベント、全台音量分離。
5. 必須10テスト合格後にPhase2/3へ。

検証サイト project_id: `appgprj_6acf7a3632a48191ac665ea5e9d57c3c`
ローカル配信用checkout: `/workspace/sites/yoimachi-renewal-lab-20261014`
元コードcheckout: `/workspace/scratch/1c4eea6bf229/tank-arena`

Sitesスキルのmanaged環境規則上、control-browserが無い現環境では別ブラウザ導入や迂回検証を行わない。描画確認済みと称さない。GitHub CLIのpushは認証不可だったためGitHubコネクタのtree→commit→ref更新を使用した。Sitesのcredentialは永続化していないため必要時再取得する。
