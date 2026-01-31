// Fungsi utama kirim pesan
async function sendMessage() {
    const input = document.getElementById('user-input');
    const query = input.value;
    if (!query) return;

    // Tampilkan pesan user di chat history
    const chatHistory = document.getElementById('chat-history');
    chatHistory.innerHTML += `<p><strong>Kamu:</strong> ${query}</p>`;
    input.value = '';

    // Step 1: Ambil context dari database (untuk "belajar" dari history)
    let context = '';
    try {
        const historySnapshot = await db.collection('chat_history').orderBy('timestamp', 'desc').limit(5).get();
        historySnapshot.forEach(doc => {
            context += `${doc.data().user}: ${doc.data().query}\nAI: ${doc.data().response}\n`;
        });
    } catch (error) {
        console.error('Error ambil history:', error);
    }

    // Step 2: Gunakan TensorFlow.js untuk analisis sederhana (belajar sentiment)
    // Model sederhana: Prediksi jika query positif/negatif untuk adjust respons
    const sentimentModel = await loadSentimentModel(); // Fungsi di bawah
    const sentiment = await predictSentiment(sentimentModel, query);
    const adjustedQuery = `${context}\n${query} (Sentiment: ${sentiment > 0.5 ? 'Positif' : 'Negatif'}. Buat respons lebih ramah jika negatif.)`;

    // Step 3: Kirim ke Puter.js AI (mirip contoh di Puter.js)
    try {
        const response = await puter.ai.chat(adjustedQuery, { model: "gpt-5-nano" });
        chatHistory.innerHTML += `<p><strong>AI:</strong> ${response}</p>`;

        // Simpan ke database untuk "belajar" selanjutnya
        await db.collection('chat_history').add({
            user: 'kamu', // Bisa ganti dengan user ID jika pakai auth
            query: query,
            response: response,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error AI:', error);
        chatHistory.innerHTML += `<p><strong>AI:</strong> Maaf, ada kesalahan.</p>`;
    }

    chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll ke bawah
}

// Fungsi load model TensorFlow.js sederhana (pre-trained sentiment)
async function loadSentimentModel() {
    // Gunakan model pre-trained sederhana (contoh: mobileNet untuk embedding, lalu classifier)
    const mobilenet = await tf.loadLayersModel('https://tfhub.dev/google/tfjs-model/mobilenet_v3/small_075_224_feature_vector/1/default/1');
    // Buat classifier sederhana (kamu bisa train lebih lanjut)
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [1024], units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Output 0-1 (sentiment)
    // Compile dan train dummy (di real, train dengan data)
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
    return { mobilenet, classifier: model }; // Return combo
}

// Fungsi prediksi sentiment
async function predictSentiment({ mobilenet, classifier }, text) {
    // Preprocess text to tensor (sederhana)
    const embedding = await mobilenet.predict(tf.zeros([1, 224, 224, 3])); // Dummy input, ganti dengan text embedding jika perlu
    const prediction = classifier.predict(embedding);
    return (await prediction.data())[0]; // 0-1 score
}
