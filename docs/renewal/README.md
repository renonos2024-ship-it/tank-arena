# 宵まちリニューアル：成果物・現在地

- [実在8タイトルの研究](game-research.md)
- [科学的な体験設計](experience-research.md)
- [現状監査・技術設計・工数・実装タスク](architecture.md)
- [射的90万発の基準値](balance-baseline.md) / [生データ](shooting-baseline.json)
- [QA記録・未完一覧](qa-checklist.md)
- [物理30分相当の結果](physics-soak.json)
- [素材・ライセンス台帳](licenses.md)

Phase 0の文書化・基準計算、およびPhase 1の物理プッシャー/共通保存基盤を実装。Phase 1は未完了。動画の直接観察・実描画・iPhone操作は未検証。

`npm ci` → `npm test` → `npm run build`。distをHTTP配信する。GitHub Actions定義あり、リモート実行結果は別途確認。

元ブランチは変更していない。射的/金魚のコア操作・バランスは維持。プッシャーは別作業ブランチで置換し、全QAゲートを通す前に元ブランチへマージしない。

検証URL（配信完了確認は後続の報告を参照）: https://yoimachi-renewal-lab-20261014.renono0119.chatgpt.site

別originでは旧サイトの残高を読み取れない。旧データは元URLに残る。新URL内の3台は共通残高を使用。
