$(document).ready(function() {
    window.scrollTo(0, 0);

    // 音声合成のための変数
    let speech = null;
    let currentText = '';
    let speakingButton = null; // 現在読み上げ中のボタン

    // 最初の画面のメッセージを更新
    $('.intro-message').html(
        'これは、生活の中で患者さんやご家族が感じるつらさを早期に把握し、必要に応じて専門スタッフがサポートするための質問票です。<br><br>' +
        '右側の緑のアイコンを押すと読み上げ機能を利用することができます。<br><br>' +
        '下のボタンを押して回答を開始してください。'
    );

    // 横スクロールバーを非表示にするためのスタイルを追加
    const preventHorizontalScrollStyle = `
        <style>
            #chatMessages, .message, .message-content, .options, .text-input-container, .vas-container, #resultSection {
                max-width: 100%;
                word-wrap: break-word;
                overflow-x: hidden;
            }
            .message-content {
                white-space: normal;
            }
            body, html {
                overflow-x: hidden;
            }
            .text-input {
                max-width: 100%;
                box-sizing: border-box;
            }
            #qrcode, #mailContainer {
                max-width: 100%;
                overflow-x: hidden;
            }
            #resultMessage {
                max-width: 100%;
                overflow-wrap: break-word;
            }
        </style>
    `;
    $('head').append(preventHorizontalScrollStyle);

    // 質問票のデータ
    const questionnaire = {
        "title": "生活のしやすさに関する質問票",
        "instructions": "これは生活の中で患者さんやご家族が感じるつらさについて情報を共有し、必要に応じて医療スタッフがサポートするための質問票です。",
        "questions": [
            {
                "id": 0,
                "question": "患者さんとご回答者のご関係を教えて下さい",
                "type": "single_choice",
                "options": ["ご本人", "ご家族", "医療者"]
            },
            {
                "id": 1.1,
                "question": "現在相談したい事項について教えて下さい（複数選択可）",
                "type": "multiple_choice",
                "options": [
                    "病状や治療について詳しく知りたい",
                    "経済的な心配がある・支払いの制度について詳しく知りたい",
                    "日常生活で困っていることがある（食事・入浴・移動・排尿・排便など）",
                    "通院が大変だと感じる",
                    "現在のところ相談したいことはない"
                ]
            },
            {
                "id": 1,
                "question": "そのほか、気になっていること、心配していることがあればご記入下さい",
                "type": "open_ended"
            },
            {
                "id": 2,
                "subquestion": "からだの症状についておうかがいします",
                "question": "現在のからだの症状はどの程度ですか？",
                "type": "single_choice",
                "options": [
                    "4: 我慢できない症状がずっとつづいている",
                    "3: 我慢できないことがしばしばあり対応してほしい",
                    "2: それほどひどくないが方法があるなら考えてほしい",
                    "1: 現在の治療に満足している",
                    "0: 症状なし"
                ]
            },
            {
                "id": 2.1,
                "question": "現在ある症状について教えて下さい",
                "type": "multiple_choice",
                "options": [
                    "食欲不振", "吐き気", "下痢", "便秘", 
                    "咳", "息苦しさ", "息切れ", "動悸",  
                    "倦怠感", "不眠", "むくみ", "痛み",
                    "特になし"
                ]
            },
            {
                "id": 3,
                "question": "この1週間の気持ちのつらさを平均して、最もあてはまる数字を選択してください。",
                "subquestion": "気持ちのつらさについておうかがいします",
                "type": "numeric_scale",
                "scale": {
                    "min": 0,
                    "max": 10,
                    "options": [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
                    "anchors": {
                        "10": "最高につらい",
                        "5": "中くらいにつらい",
                        "0": "つらさはない"
                    }
                }
            },
            {
                "id": 4,
                "question": "以下のうち、相談を希望するものを選択してください（複数選択可）",
                "type": "multiple_choice",
                "options": [
                    "痛みなどからだの症状や気持ちのつらさに対応する緩和ケア医師、看護師への相談",
                    "経済的な問題や、制度の疑問に対応する医療ソーシャルワーカーへの相談",
                    "自宅での生活がしやすいように、利用できるサービスがあるかどうかについての相談",
                    "現在のところ特に相談は希望しない"
                ]
            }
        ]
    };

    let currentQuestionIndex = 0;
    let currentSubQuestionIndex = 0;
    let answers = {};
    let relationshipAnswer = ""; // 関係性の回答を保存する変数

    // 開始ボタンのイベントリスナー
    $('#startButton').on('click', function() {
        // 開始画面を非表示
        $('#startScreen').hide();
        // チャットインターフェースを表示
        $('#chatInterface').show();
        
        // ページを先頭にスクロール
        window.scrollTo(0, 0);
        $('html, body').scrollTop(0);
        
        // 最初のメッセージを表示
        addBotMessages([
            'これは、生活の中で患者さんやご家族が感じるつらさを早期に把握し、必要に応じて専門スタッフがサポートするための質問票です。',
            'それでは質問に順番にお答えください。'
        ]);
        
        // 最初の質問を表示
        setTimeout(() => {
            showQuestion(0);
        }, 2000);
    });

    // 最初の画面に読み上げボタンを追加
    $(document).ready(function() {
        const introText = $('.intro-message').text();
        const $introMessage = $('.intro-message');
        const $speechButton = $('<button class="speech-button" aria-label="読み上げる"></button>');
        
        $speechButton.on('click', function() {
            toggleSpeech(this, introText);
        });
        
        $introMessage.css('position', 'relative');
        $introMessage.append($speechButton);
    });

    // ページ下部に自動スクロール
    function scrollToLatestContent() {
        const $chatMessages = $('#chatMessages');
        $chatMessages.animate({
            scrollTop: $chatMessages[0].scrollHeight
        }, 600);
        
        // 画面全体も適切な位置までスクロール
        const $lastMessage = $('.message:last-child, .options:last-child, .text-input-container:last-child, .vas-container:last-child, .multiple-choice-container:last-child, .numeric-buttons-container:last-child, .symptom-buttons-container:last-child');
        if ($lastMessage.length) {
            const bottomPosition = $lastMessage.offset().top + $lastMessage.outerHeight();
            const windowHeight = $(window).height();
            const targetScroll = bottomPosition - windowHeight + 200; // 余白を200pxに増やして確実にコンテナの末尾までスクロール
            
            $('html, body').animate({
                scrollTop: Math.max(targetScroll, 0)
            }, 600);
        }
    }

    // ボットメッセージを追加
    function addBotMessage(text) {
        const $messageDiv = $('<div class="message bot"></div>');
        const $messageContent = $('<div class="message-content"></div>').text(text);
        const $speechButton = $('<button class="speech-button" aria-label="読み上げる"></button>');
        
        $speechButton.on('click', function() {
            toggleSpeech(this, text);
        });
        
        $messageContent.append($speechButton);
        $messageDiv.append($messageContent);
        $('#chatMessages').append($messageDiv);
        scrollToLatestContent();
    }

    // ユーザーメッセージを追加
    function addUserMessage(text) {
        const $messageDiv = $('<div class="message user"></div>');
        const $messageContent = $('<div class="message-content"></div>').text(text);
        $messageDiv.append($messageContent);
        $('#chatMessages').append($messageDiv);
        scrollToLatestContent();
    }

    // 複数のボットメッセージを連続して表示
    function addBotMessages(messages, currentIndex = 0, delay = 600) {
        if (currentIndex < messages.length) {
            addBotMessage(messages[currentIndex]);
            setTimeout(() => {
                addBotMessages(messages, currentIndex + 1, delay);
            }, delay);
        }
    }

    // 質問を表示する関数
    function showQuestion(index) {
        if (index >= questionnaire.questions.length) {
            // 全ての質問が終了したら結果表示ボタンを表示
            showResultButton();
            return;
        }

        const question = questionnaire.questions[index];
        
        // サブクエスチョンがあれば先に表示
        if (question.subquestion) {
            addBotMessage(question.subquestion);
            setTimeout(() => {
                // 質問を表示
                addBotMessage(question.question);
                createQuestionUI(index);
            }, 500);
        } else {
            // 質問を表示
            addBotMessage(question.question);
            createQuestionUI(index);
        }
    }
    
    // 質問タイプに応じたUI要素を作成
    function createQuestionUI(index) {
        const question = questionnaire.questions[index];
        
        setTimeout(() => {
            switch(question.type) {
                case "open_ended":
                    createOpenEndedInput(index);
                    break;
                case "single_choice":
                    // サブアイテムがある場合は、サブアイテムの処理を開始
                    if (question.subItems) {
                        setTimeout(() => {
                            // 最初のサブアイテムを表示
                            currentSubQuestionIndex = 0;
                            showSubQuestion(index, currentSubQuestionIndex);
                        }, 500);
                    } else {
                        // 通常の単一選択肢
                        createSingleChoiceOptions(index);
                    }
                    break;
                case "multiple_choice":
                    // 複数選択可能な選択肢
                    createMultipleChoiceOptions(index);
                    break;
                case "numeric_scale":
                    if (question.scale.anchors) {
                        // スケールの目盛りの説明を表示
                        const anchorsText = Object.entries(question.scale.anchors)
                            .map(([value, label]) => `${value}: ${label}`)
                            .join('、 ');
                        addBotMessage(anchorsText);
                    }
                    setTimeout(() => {
                        createNumericScale(index);
                    }, 500);
                    break;
            }
        }, 500);
    }
    
    // サブクエスチョンを表示
    function showSubQuestion(questionIndex, subIndex) {
        const question = questionnaire.questions[questionIndex];
        const subItems = question.subItems;
        
        if (subIndex >= subItems.length) {
            // すべてのサブアイテムが終了したら次の質問へ
            setTimeout(() => {
                currentQuestionIndex++;
                showQuestion(currentQuestionIndex);
                // スクロール処理を追加
                scrollToLatestContent();
            }, 800);
            return;
        }
        
        // サブアイテムを表示
        addBotMessage(subItems[subIndex].item);
        
        // 選択肢を表示
        setTimeout(() => {
            createSubItemOptions(questionIndex, subIndex);
            // スクロール処理を追加
            scrollToLatestContent();
        }, 500);
    }
    
    // サブアイテム選択肢を作成
    function createSubItemOptions(questionIndex, subIndex) {
        const question = questionnaire.questions[questionIndex];
        const subItem = question.subItems[subIndex];
        
        // 選択肢ボタンを作成
        const $optionsDiv = $('<div class="options"></div>');
        
        // 選択肢のテキストを生成（読み上げ用）
        let optionsText = '選択肢は、';
        subItem.options.forEach((option, index) => {
            optionsText += option;
            if (index < subItem.options.length - 1) {
                optionsText += '、';
            }
        });
        optionsText += 'です。';
        
        // 音声読み上げボタンを質問のメッセージに追加
        const $messageContent = $('.message.bot:last-child .message-content');
        const $speechButton = $('<button class="speech-button" aria-label="読み上げる"></button>');
        
        $speechButton.on('click', function() {
            toggleSpeech(this, optionsText);
        });
        
        if ($messageContent.find('.speech-button').length === 0) {
            $messageContent.append($speechButton);
        }
        
        subItem.options.forEach((option) => {
            const $button = $('<button class="option-button"></button>').text(option);
            
            // 既存の回答があれば選択状態にする
            if (answers[question.id] && answers[question.id][subItem.item] === option) {
                $button.addClass('selected');
            }
            
            $button.on('click', function() {
                // 「特になし」が選択された場合は他の選択肢をクリア
                if (option === "特になし" || option === "現在のところ相談したいことはない" || option === "現在のところ特に相談は希望しない") {
                    // 他の選択肢をクリア
                    $optionsDiv.find('.option-button').not(this).removeClass('selected');
                    // selectedOptionsから他のオプションを削除
                    selectedOptions.length = 0;
                    selectedOptions.push(option);
                } else {
                    // 「特になし」系が選択されていたら解除
                    const specialOptions = ["特になし", "現在のところ相談したいことはない", "現在のところ特に相談は希望しない"];
                    specialOptions.forEach(specialOption => {
                        const $specialButton = $optionsDiv.find('.option-button').filter(function() {
                            return $(this).text() === specialOption;
                        });
                        if ($specialButton.hasClass('selected')) {
                            $specialButton.removeClass('selected');
                            const index = selectedOptions.indexOf(specialOption);
                            if (index > -1) {
                                selectedOptions.splice(index, 1);
                            }
                        }
                    });
                    
                    // 複数選択可能なのでトグルで選択/非選択を切り替え
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                        const index = selectedOptions.indexOf(option);
                        if (index > -1) {
                            selectedOptions.splice(index, 1);
                        }
                    } else {
                        $(this).addClass('selected');
                        selectedOptions.push(option);
                    }
                }
                
                // 選択状態に応じて確定ボタンの有効/無効を切り替え
                if (selectedOptions.length > 0 || ((question.id === 1.1 || question.id === 2.1) && $textInput && $textInput.val().trim())) {
                    $confirmButton.prop('disabled', false);
                } else {
                    $confirmButton.prop('disabled', true);
                }
            });
            
            $optionsDiv.append($button);
        });
        
        // 余白を確保するための空のdivを追加
        $optionsDiv.append('<div class="options-padding"></div>');
        
        $('#chatMessages').append($optionsDiv);
        scrollToLatestContent();
    }

    // 単一選択肢を作成（関係性質問、症状レベル質問用）
    function createSingleChoiceOptions(questionIndex) {
        const question = questionnaire.questions[questionIndex];
        
        // 選択肢のテキストを生成（読み上げ用）
        let optionsText = '選択肢は、';
        question.options.forEach((option, index) => {
            optionsText += option;
            if (index < question.options.length - 1) {
                optionsText += '、';
            }
        });
        optionsText += 'です。';
        
        // 音声読み上げボタンを質問のメッセージに追加
        const $messageContent = $('.message.bot:last-child .message-content');
        const $speechButton = $('<button class="speech-button" aria-label="読み上げる"></button>');
        
        // 質問の内容と選択肢を合わせた読み上げテキスト
        const readText = question.question + '。' + optionsText;
        
        $speechButton.on('click', function() {
            toggleSpeech(this, readText);
        });
        
        if ($messageContent.find('.speech-button').length === 0) {
            $messageContent.append($speechButton);
        }
        
        const $optionsDiv = $('<div class="options"></div>');
        let selectedOption = null;
        
        // 最後の選択肢と読み上げボタンを一緒に配置するための行
        const $lastOptionRow = $('<div class="option-row"></div>');
        
        question.options.forEach((option, index) => {
            const $button = $('<button class="option-button"></button>').text(option);
            
            $button.on('click', function() {
                // 全てのボタンからselectedクラスを削除
                $('.option-button').removeClass('selected');
                // クリックされたボタンにselectedクラスを追加
                $(this).addClass('selected');
                
                // 選択された選択肢を保存
                selectedOption = option;
                
                // 質問ID 0または2の場合は確定ボタンを有効化
                if (question.id === 0 || question.id === 2) {
                    $confirmButton.prop('disabled', false);
                } else {
                    // その他の質問は従来通り自動的に進む
                    if (currentQuestionIndex === questionIndex) {
                        // ユーザーメッセージは全ての質問で表示する
                        addUserMessage(option);
                        
                        // オプションを削除
                        $optionsDiv.remove();
                        
                        // 次の質問へ
                        setTimeout(() => {
                            currentQuestionIndex++;
                            showQuestion(currentQuestionIndex);
                        }, 800);
                    }
                }
            });
            
            // 最後の選択肢の場合は特別な処理
            if (index === question.options.length - 1) {
                // 読み上げボタンを作成
                const $optionsSpeechButton = $('<button class="options-speech-button" aria-label="選択肢を読み上げる"></button>');
                $optionsSpeechButton.on('click', function() {
                    toggleSpeech(this, optionsText);
                });
                
                // 最後の選択肢と読み上げボタンを同じ行に追加
                $lastOptionRow.append($button);
                $lastOptionRow.append($optionsSpeechButton);
                $optionsDiv.append($lastOptionRow);
            } else {
                // 最後以外の選択肢は通常通り追加
                $optionsDiv.append($button);
            }
        });
        
        // 質問ID 0または2の場合は確定ボタンを追加
        let $confirmButton;
        if (question.id === 0 || question.id === 2) {
            $confirmButton = $('<button class="numeric-confirm" disabled>確定</button>');
            
            $confirmButton.on('click', function() {
                if (selectedOption) {
                    // 回答を保存
                    answers[question.id] = selectedOption;
                    
                    // 質問ID=0の回答は関係性の回答として特別に保存
                    if (question.id === 0) {
                        relationshipAnswer = selectedOption;
                    }
                    
                    // ユーザーメッセージとして表示
                    addUserMessage(selectedOption);
                    
                    // オプションを削除
                    $optionsDiv.remove();
                    
                    // 質問ID 2で「0: 症状なし」が選択された場合の特別処理
                    if (question.id === 2 && selectedOption === "0: 症状なし") {
                        // 質問2.1をスキップして、「症状なし」を回答として設定
                        answers[2.1] = "症状なし";
                        
                        // 質問3に直接進む（質問2.1をスキップ）
                        setTimeout(() => {
                            // currentQuestionIndexを2つ進める（2.1をスキップ）
                            currentQuestionIndex += 2;
                            showQuestion(currentQuestionIndex);
                            // スクロール処理を追加
                            scrollToLatestContent();
                        }, 800);
                    } else {
                        // 通常通り次の質問へ
                        setTimeout(() => {
                            currentQuestionIndex++;
                            showQuestion(currentQuestionIndex);
                            // スクロール処理を追加
                            scrollToLatestContent();
                        }, 800);
                    }
                }
            });
            
            $optionsDiv.append($confirmButton);
        }
        
        // 余白を確保するための空のdivを追加
        $optionsDiv.append('<div class="options-padding"></div>');
        
        $('#chatMessages').append($optionsDiv);
        scrollToLatestContent();
    }

    // 複数選択肢を作成
    function createMultipleChoiceOptions(questionIndex) {
        const question = questionnaire.questions[questionIndex];
        const $inputContainer = $('<div class="multiple-choice-container"></div>');
        
        // 症状の質問（ID 2.1）の場合は特別なクラスを追加
        if (question.id === 2.1) {
            $inputContainer.addClass('question-2-1');
        }
        
        // 選択肢のテキストを生成（読み上げ用）
        let optionsText = '選択肢は、';
        question.options.forEach((option, index) => {
            optionsText += option;
            if (index < question.options.length - 1) {
                optionsText += '、';
            }
        });
        optionsText += 'です。';
        
        // 音声読み上げボタンを質問のメッセージに追加
        const $messageContent = $('.message.bot:last-child .message-content');
        const $speechButton = $('<button class="speech-button" aria-label="読み上げる"></button>');
        
        // 質問の内容と選択肢を合わせた読み上げテキスト
        const readText = question.question + '。' + optionsText;
        
        $speechButton.on('click', function() {
            toggleSpeech(this, readText);
        });
        
        if ($messageContent.find('.speech-button').length === 0) {
            $messageContent.append($speechButton);
        }
        
        // 選択肢ボタンを作成
        const $optionsDiv = $('<div class="options"></div>');
        const selectedOptions = [];
        
        // 特殊オプションを識別する配列
        const specialOptions = ["特になし", "現在のところ相談したいことはない", "現在のところ特に相談は希望しない"];
        
        // 通常オプションと特殊オプションを分けて処理
        const normalOptions = [];
        const specialOptionsList = [];
        
        question.options.forEach(option => {
            if (specialOptions.includes(option)) {
                specialOptionsList.push(option);
            } else {
                normalOptions.push(option);
            }
        });
        
        // 最後の通常選択肢と読み上げボタンを一緒に配置するための行
        const $lastNormalOptionRow = $('<div class="option-row"></div>');
        
        // 通常オプションを追加
        normalOptions.forEach((option, index) => {
            const $button = $('<button class="option-button"></button>').text(option);
            
            $button.on('click', function() {
                // 他の特殊選択肢（「特になし」など）が選択されていれば解除
                const $specialOptionsContainer = $inputContainer.find('.options.special-options');
                specialOptions.forEach(specialOption => {
                    if ($specialOptionsContainer.length > 0) {
                        const $specialButton = $specialOptionsContainer.find('.option-button').filter(function() {
                            return $(this).text() === specialOption;
                        });
                        if ($specialButton.hasClass('selected')) {
                            $specialButton.removeClass('selected');
                            const index = selectedOptions.indexOf(specialOption);
                            if (index > -1) {
                                selectedOptions.splice(index, 1);
                            }
                        }
                    }
                });
                
                // 複数選択可能なのでトグルで選択/非選択を切り替え
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    const index = selectedOptions.indexOf(option);
                    if (index > -1) {
                        selectedOptions.splice(index, 1);
                    }
                } else {
                    $(this).addClass('selected');
                    selectedOptions.push(option);
                }
                
                // 選択状態に応じて確定ボタンの有効/無効を切り替え
                if (selectedOptions.length > 0 || ((question.id === 1.1 || question.id === 2.1) && $textInput && $textInput.val().trim())) {
                    $confirmButton.prop('disabled', false);
                } else {
                    $confirmButton.prop('disabled', true);
                }
            });
            
            // 最後の選択肢の場合は特別な処理
            if (index === normalOptions.length - 1) {
                // 読み上げボタンを作成
                const $optionsSpeechButton = $('<button class="options-speech-button" aria-label="選択肢を読み上げる"></button>');
                $optionsSpeechButton.on('click', function() {
                    toggleSpeech(this, optionsText);
                });
                
                // 最後の選択肢と読み上げボタンを同じ行に追加
                $lastNormalOptionRow.append($button);
                $lastNormalOptionRow.append($optionsSpeechButton);
                $optionsDiv.append($lastNormalOptionRow);
            } else {
                // 最後以外の選択肢は通常通り追加
                $optionsDiv.append($button);
            }
        });
        
        $inputContainer.append($optionsDiv);
        
        // 質問ID 1.1（相談したい事項）または質問ID 2.1（症状）には追加のテキスト入力欄を表示
        let $textInput;
        if (question.id === 1.1 || question.id === 2.1) {
            const $textInputWrapper = $('<div class="text-input-wrapper"></div>');
            let placeholder = question.id === 1.1 
                ? "そのほか、気になっていること、心配していることがあればご記入下さい"
                : "その他の症状があればご記入下さい";
            $textInput = $('<textarea class="text-input" rows="3"></textarea>').attr('placeholder', placeholder);
            $textInputWrapper.append($textInput);
            $inputContainer.append($textInputWrapper);
            
            // テキスト入力の変更を監視
            $textInput.on('input', function() {
                if (selectedOptions.length > 0 || $(this).val().trim()) {
                    $confirmButton.prop('disabled', false);
                } else {
                    $confirmButton.prop('disabled', true);
                }
            });
        }
        
        // 特殊オプション（「特になし」など）をテキストボックスの下に追加
        if (specialOptionsList.length > 0) {
            const $specialOptionsDiv = $('<div class="options special-options"></div>');
            
            specialOptionsList.forEach((option, index) => {
                const $button = $('<button class="option-button"></button>').text(option);
                
                $button.on('click', function() {
                    // 他の選択肢をクリア
                    $optionsDiv.find('.option-button').removeClass('selected');
                    $specialOptionsDiv.find('.option-button').not(this).removeClass('selected');
                    
                    // selectedOptionsから他のオプションを削除
                    selectedOptions.length = 0;
                    
                    // この選択肢の選択状態をトグル
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                    } else {
                        $(this).addClass('selected');
                        selectedOptions.push(option);
                    }
                    
                    // 選択状態に応じて確定ボタンの有効/無効を切り替え
                    if (selectedOptions.length > 0 || ((question.id === 1.1 || question.id === 2.1) && $textInput && $textInput.val().trim())) {
                        $confirmButton.prop('disabled', false);
                    } else {
                        $confirmButton.prop('disabled', true);
                    }
                });
                
                // すべての特殊選択肢を通常通り追加（読み上げボタンなし）
                $specialOptionsDiv.append($button);
            });
            
            $inputContainer.append($specialOptionsDiv);
        }
        
        // 確定ボタン
        const $confirmButton = $('<button class="multiple-choice-confirm" disabled>確定</button>');
        
        $confirmButton.on('click', function() {
            // 少なくとも1つは選択されているか、テキスト入力がある場合のみ処理
            if (selectedOptions.length > 0 || ((question.id === 1.1 || question.id === 2.1) && $textInput && $textInput.val().trim())) {
                // 回答を保存
                answers[question.id] = {
                    selectedOptions: selectedOptions
                };
                
                // テキスト入力がある場合は保存
                if ((question.id === 1.1 || question.id === 2.1) && $textInput) {
                    const additionalText = $textInput.val().trim();
                    if (additionalText) {
                        if (question.id === 1.1) {
                            answers[1] = additionalText;
                        } else if (question.id === 2.1) {
                            answers[question.id].additionalText = additionalText;
                        }
                    }
                }
                
                // ユーザーメッセージとして表示
                let displayAnswer = selectedOptions.join('、');
                if ((question.id === 1.1 || question.id === 2.1) && $textInput && $textInput.val().trim()) {
                    displayAnswer += '、その他: ' + $textInput.val().trim();
                }
                
                addUserMessage(displayAnswer);
                
                // 入力コンテナを削除
                $inputContainer.remove();
                
                // 質問ID 1.1の場合は質問ID 2へ（質問ID 1をスキップ）
                if (question.id === 1.1) {
                    setTimeout(() => {
                        currentQuestionIndex += 2; // 質問ID 1をスキップ
                        showQuestion(currentQuestionIndex);
                        // スクロール処理を追加
                        scrollToLatestContent();
                    }, 800);
                } else {
                    // 通常通り次の質問へ
                    setTimeout(() => {
                        currentQuestionIndex++;
                        showQuestion(currentQuestionIndex);
                        // スクロール処理を追加
                        scrollToLatestContent();
                    }, 800);
                }
            }
        });
        
        $inputContainer.append($confirmButton);
        $('#chatMessages').append($inputContainer);
        scrollToLatestContent();
    }

    // テキスト入力フォームを作成
    function createOpenEndedInput(questionIndex) {
        const question = questionnaire.questions[questionIndex];
        const $inputContainer = $('<div class="text-input-container"></div>');
        const $textInput = $('<textarea class="text-input" rows="3" placeholder="こちらに入力してください"></textarea>');
        const $submitButton = $('<button class="text-submit">確定</button>');
        
        $inputContainer.append($textInput);
        
        // 症状ボタンを追加（質問ID 2.1の場合のみ）
        if (question.id === 2.1) {
            const $symptomButtonsContainer = $('<div class="symptom-buttons-container"></div>');
            const $symptomLabel = $('<div class="symptom-label">症状の選択肢（クリックして追加）：</div>');
            $symptomButtonsContainer.append($symptomLabel);
            
            // 音声読み上げボタンを質問のメッセージに追加
            const $messageContent = $('.message.bot:last-child .message-content');
            const $speechButton = $('<button class="speech-button" aria-label="症状リストを読み上げる"></button>');
            
            // 症状リスト
            const symptoms = [
                "食欲不振", "吐き気", "下痢", "便秘", 
                "咳", "息苦しさ", "息切れ", "動悸",  
                "倦怠感", "不眠", "むくみ", "痛み" 
            ];
            
            // 症状リストを読み上げるテキスト
            let symptomText = 'よくある症状は、';
            symptoms.forEach((symptom, index) => {
                symptomText += symptom;
                if (index < symptoms.length - 1) {
                    symptomText += '、';
                }
            });
            symptomText += 'です。ボタンをクリックすると回答に追加されます。';
            
            $speechButton.on('click', function() {
                toggleSpeech(this, symptomText);
            });
            
            if ($messageContent.find('.speech-button').length === 0) {
                $messageContent.append($speechButton);
            }
            
            // 症状ボタンを追加
            const $symptomButtons = $('<div class="symptom-buttons"></div>');
            symptoms.forEach(symptom => {
                const $button = $('<button class="symptom-button"></button>').text(symptom);
                
                $button.on('click', function() {
                    // 現在のテキストエリアの内容を取得
                    let currentText = $textInput.val();
                    
                    // 症状を追加（既に内容がある場合は区切り文字を入れる）
                    if (currentText && !currentText.endsWith('、') && !currentText.endsWith('\n')) {
                        if (currentText.endsWith('。')) {
                            currentText += '\n';
                        } else {
                            currentText += '、';
                        }
                    }
                    
                    // テキストエリアに反映
                    $textInput.val(currentText + symptom);
                    // フォーカスを戻す
                    $textInput.focus();
                });
                
                $symptomButtons.append($button);
            });
            
            $symptomButtonsContainer.append($symptomButtons);
            $inputContainer.append($symptomButtonsContainer);
        }
        
        $inputContainer.append($submitButton);
        $('#chatMessages').append($inputContainer);
        scrollToLatestContent();
        
        $textInput.focus();
        
        $submitButton.on('click', function() {
            const answer = $textInput.val().trim();
            if (answer) {
                // 回答を保存
                answers[question.id] = answer;
                
                // 入力フォームを非表示（削除ではなく）
                $inputContainer.hide();
                
                // この質問が現在の質問の場合のみ次の質問に進む
                if (currentQuestionIndex === questionIndex) {
                    // ユーザーメッセージとして表示
                    addUserMessage(answer);
                    
                    // 入力フォームを削除
                    $inputContainer.remove();
                    
                    // 次の質問へ進む
                    setTimeout(() => {
                        currentQuestionIndex++;
                        showQuestion(currentQuestionIndex);
                        // スクロール処理を追加
                        scrollToLatestContent();
                    }, 800);
                }
            } else {
                alert('回答を入力してください');
            }
        });
    }

    // 数値スケールを作成
    function createNumericScale(questionIndex) {
        const question = questionnaire.questions[questionIndex];
        const scale = question.scale;
        
        const $scaleContainer = $('<div class="numeric-buttons-container"></div>');
        const $buttonsRow = $('<div class="numeric-buttons-row"></div>');
        const $valueDisplay = $('<div class="vas-value">選択してください</div>');
        
        // 既存の回答があれば設定
        let selectedValue = null;
        if (answers[question.id]) {
            selectedValue = answers[question.id];
            updateValueDisplay(selectedValue);
        }
        
        // スケールのラベルは表示しない（メッセージで説明済み）
        
        // ボタンサイズを画面幅に応じて動的に調整
        const adjustButtonSize = function() {
            const containerWidth = $buttonsRow.width();
            if (containerWidth) {
                // 余裕を持たせるために、より多くの余白を確保する
                const buttonWidth = Math.floor((containerWidth - 44) / 11); // 11個のボタン + 余裕のあるマージン分
                $buttonsRow.find('.numeric-button').css({
                    'min-width': buttonWidth + 'px',
                    'width': buttonWidth + 'px'
                });
            }
        };
        
        // 0-10のボタンを作成
        for (let i = 0; i <= 10; i++) {
            const $button = $('<button class="numeric-button square"></button>').text(i);
            
            // 既存の回答があれば選択状態にする
            if (selectedValue !== null && parseInt(selectedValue) === i) {
                $button.addClass('selected');
            }
            
            $button.on('click', function() {
                // ボタンの選択状態を変更
                $buttonsRow.find('.numeric-button').removeClass('selected');
                $(this).addClass('selected');
                
                const value = i.toString();
                
                // 表示を更新
                updateValueDisplay(value);
                
                // 回答を一時保存
                selectedValue = value;
                
                // 確定ボタンを有効化
                $confirmButton.prop('disabled', false);
            });
            
            $buttonsRow.append($button);
        }
        
        // 確定ボタンを作成
        const $confirmButton = $('<button class="numeric-confirm" disabled>確定</button>');
        
        $confirmButton.on('click', function() {
            if (selectedValue === null) return; // 選択がない場合は何もしない
            
            // 回答を保存
            answers[question.id] = selectedValue;
            
            // ユーザーメッセージとして表示
            let displayValue = selectedValue;
            if (scale.anchors && scale.anchors[selectedValue]) {
                displayValue = `${selectedValue}`;
            }
            addUserMessage(displayValue);
            
            // スケールコンテナを削除
            $scaleContainer.remove();
            
            // 次の質問へ進む
            setTimeout(() => {
                currentQuestionIndex++;
                showQuestion(currentQuestionIndex);
                // スクロール処理を追加
                scrollToLatestContent();
            }, 800);
        });
        
        // 選択肢のテキストを生成（読み上げ用）
        let scaleText = '0から10の数字でお答えください。';
        if (scale.anchors) {
            scaleText += '0は「つらさはない」、5は「中くらいにつらい」、10は「最高につらい」を意味します。';
        }
        
        // 音声読み上げボタンを質問のメッセージに追加
        const $messageContent = $('.message.bot:last-child .message-content');
        const $speechButton = $('<button class="speech-button" aria-label="説明を読み上げる"></button>');
        
        $speechButton.on('click', function() {
            toggleSpeech(this, scaleText);
        });
        
        if ($messageContent.find('.speech-button').length === 0) {
            $messageContent.append($speechButton);
        }
        
        function updateValueDisplay(value) {
            if (value === null) {
                $valueDisplay.text('選択してください');
            } else {
                $valueDisplay.html(`現在の選択値：<span style="font-weight: bold;">${value}</span>`);
            }
        }
        
        $scaleContainer.append($buttonsRow, $valueDisplay, $confirmButton);
        $('#chatMessages').append($scaleContainer);
        
        // ボタンサイズを調整
        setTimeout(adjustButtonSize, 0);
        $(window).on('resize', adjustButtonSize);
        
        scrollToLatestContent();
    }

    // 結果表示ボタンを表示
    function showResultButton() {
        addBotMessages([
            'すべての質問に回答いただき、ありがとうございました。',
            '回答内容を確認し、必要に応じて専門スタッフからサポートをさせていただきます。'
        ]);
        
        setTimeout(() => {
            // すでに結果ボタンがある場合は作成しない
            if ($('#showResultButton').length === 0) {
                const $resultButtonContainer = $('<div class="button-container" id="resultButtonContainer"></div>');
                const $resultButton = $('<button id="showResultButton">回答結果を表示</button>');
                
                $resultButton.on('click', function() {
                    $(this).prop('disabled', true);
                    $(this).text('表示中...');
                    
                    // 結果画面を表示
                    showResults();
                    
                    // ボタンを再度有効化し、テキストを元に戻す
                    setTimeout(() => {
                        $(this).prop('disabled', false);
                        $(this).text('回答結果を表示');
                    }, 1500);
                    
                    // ボタンコンテナを削除しない
                    // $resultButtonContainer.remove(); この行を削除
                });
                
                $resultButtonContainer.append($resultButton);
                $('#chatMessages').append($resultButtonContainer);
            } else {
                // すでにボタンが存在する場合は再度有効化
                $('#showResultButton').prop('disabled', false);
                $('#showResultButton').text('回答結果を表示');
            }
            
            scrollToLatestContent();
        }, 1500);
    }

    // 結果表示関数
    function showResults() {
        // 結果セクションがまだ表示されていない場合のみメッセージを追加
        if (!$('#resultSection').is(':visible')) {
            addBotMessage('回答結果:');
        }
        
        // 結果セクションを表示
        $('#resultSection').show();
        
        // 結果をクリアして更新
        $('#resultMessage').empty();
        $('#mailContainer').empty();
        $('#qrcode').empty();
        
        // 結果をチャット内に表示
        const formattedText = generateFormattedText(answers);
        $('#resultMessage').html(formattedText);
        
        // 人間が読める形式の回答を生成
        const readableData = generateReadableData(answers);
        
        // メール送信リンク
        const mailSubject = encodeURIComponent('生活のしやすさに関する質問票の回答');
        const mailBody = encodeURIComponent(readableData);
        const mailLink = `mailto:?subject=${mailSubject}&body=${mailBody}`;
        
        $('#mailContainer').html(`
            <a href="${mailLink}" class="mail-link">メールで送信</a>
        `);
        
        // QRコード生成
        generateQRCode(readableData);
        
        // 結果セクションまでスクロール
        $('html, body').animate({
            scrollTop: $('#resultSection').offset().top
        }, 800);
    }

    // 結果のテキスト生成関数
    function generateFormattedText(data) {
        let text = "";

        // 調査日時
        text += `調査日時：${new Date().toLocaleString('ja-JP')}<br>`;

        // 回答者
        if (relationshipAnswer) {
            text += `回答者：${relationshipAnswer}<br>`;
        }

        // 相談したい事項
        if (data[1.1] && data[1.1].selectedOptions) {
            text += `質問1.1：${data[1.1].selectedOptions.join('、')}<br>`;
        }

        // その他の相談事項
        if (data[1]) {
            text += `質問1：${data[1]}<br>`;
        }

        // からだの症状
        if (data[2]) {
            text += `質問2：${data[2]}<br>`;
        }
        
        // 症状詳細
        if (data[2.1]) {
            // オブジェクト形式の場合は selectedOptions を表示
            if (typeof data[2.1] === 'object' && data[2.1].selectedOptions) {
                text += `質問2.1：${data[2.1].selectedOptions.join('、')}`;
                // 追加テキストがある場合は表示
                if (data[2.1].additionalText) {
                    text += `、その他: ${data[2.1].additionalText}`;
                }
                text += '<br>';
            } else {
                // 文字列の場合はそのまま表示
                text += `質問2.1：${data[2.1]}<br>`;
            }
        }
        
        // 気持ちのつらさ
        if (data[3]) {
            text += `質問3：${data[3]}<br>`;
        }
        
        // 相談を希望するもの
        if (data[4] && data[4].selectedOptions) {
            text += `質問4：${data[4].selectedOptions.join('、')}<br>`;
        }
        
        return text;
    }

    // 人間が読める形式のデータを生成する関数
    function generateReadableData(data) {
        const today = new Date();
        const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
        
        let text = `回答日：${dateStr}\n`;
        text += `記入者：${relationshipAnswer}\n`;
        
        // 相談したい事項
        if (data[1.1] && data[1.1].selectedOptions) {
            text += `質問1.1：${data[1.1].selectedOptions.join('、')}\n`;
        }
        
        // 自由記述
        if (data[1]) {
            text += `質問1：${data[1]}\n`;
        }
        
        // 身体症状のレベル
        if (data[2]) {
            // 数値のみ抽出（「4: 我慢できない...」から「4」の部分を取り出す）
            const symptomLevel = data[2].split(':')[0].trim();
            text += `質問2：${symptomLevel}\n`;
        }
        
        // 症状詳細
        if (data[2.1]) {
            // オブジェクト形式の場合は selectedOptions を表示
            if (typeof data[2.1] === 'object' && data[2.1].selectedOptions) {
                text += `質問2.1：${data[2.1].selectedOptions.join('、')}`;
                // 追加テキストがある場合は表示
                if (data[2.1].additionalText) {
                    text += `、その他: ${data[2.1].additionalText}`;
                }
                text += '\n';
            } else {
                // 文字列の場合はそのまま表示
                text += `質問2.1：${data[2.1]}\n`;
            }
        }
        
        // 気持ちのつらさ
        if (data[3]) {
            text += `質問3：${data[3]}\n`;
        }
        
        // 相談を希望するもの
        if (data[4] && data[4].selectedOptions) {
            text += `質問4：${data[4].selectedOptions.join('、')}\n`;
        }
        
        return text;
    }

    // QRコード生成関数
    function generateQRCode(text) {
        // QRコードを生成
        $('#qrcode').empty();
        $('#qrcode').append('<h3>QRコード</h3>');
        $('#qrcode').append('<p>このQRコードをスキャンすると回答データが取得できます。</p>');
        
        // UTF-8からShift_JISに変換
        const utf8Array = Encoding.stringToCode(text);
        const sjisArray = Encoding.convert(utf8Array, {
            to: 'SJIS',
            from: 'UNICODE'
        });
        
        // バイナリ文字列に変換
        const sjisStr = Encoding.codeToString(sjisArray);
        
        const $qrDiv = $('<div></div>');
        $qrDiv.qrcode({
            text: sjisStr,
            width: 256,
            height: 256
        });
        
        $('#qrcode').append($qrDiv);
    }
    
    // 音声読み上げ機能
    function toggleSpeech(button, text) {
        const $button = $(button);
        
        // 現在話している場合は停止
        if ($button.hasClass('speaking')) {
            stopReading();
            return;
        }
        
        // 他のボタンが読み上げ中なら停止する
        if (speakingButton) {
            $(speakingButton).removeClass('speaking');
        }
        
        // このボタンを読み上げ中に設定
        $button.addClass('speaking');
        speakingButton = button;
        
        // 読み上げ開始
        startReading(text);
    }
    
    function startReading(text) {
        // 今読み上げ中なら停止
        if (speech) {
            window.speechSynthesis.cancel();
        }
        
        // 新しい音声合成オブジェクトを作成
        speech = new SpeechSynthesisUtterance();
        
        // 読み上げるテキストを設定
        speech.text = text;
        currentText = text;
        
        // 日本語の音声を設定
        speech.lang = 'ja-JP';
        
        // 読み上げ速度を調整（0.8倍速）
        speech.rate = 0.8;
        
        // 音声を再生
        window.speechSynthesis.speak(speech);
        
        // 読み上げ完了時の処理
        speech.onend = function() {
            currentText = '';
            if (speakingButton) {
                $(speakingButton).removeClass('speaking');
                speakingButton = null;
            }
        };
    }
    
    function stopReading() {
        if (speech) {
            window.speechSynthesis.cancel();
            currentText = '';
            if (speakingButton) {
                $(speakingButton).removeClass('speaking');
                speakingButton = null;
            }
        }
    }
    
    // ページを離れるときに音声を停止
    window.addEventListener('beforeunload', function() {
        if (speech) {
            window.speechSynthesis.cancel();
        }
    });
});