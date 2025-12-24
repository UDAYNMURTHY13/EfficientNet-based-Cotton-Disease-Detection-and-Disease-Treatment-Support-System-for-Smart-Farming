package com.cottoncare.diseasedetection;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {

    private static final int CAMERA_REQUEST = 1888;
    private static final int GALLERY_REQUEST = 1889;
    private static final int CAMERA_PERMISSION_CODE = 100;

    private ImageView imageView;
    private Button btnCamera, btnGallery, btnAnalyze;
    private TextView tvDisease, tvConfidence, tvSeverity, tvTreatment;
    private ProgressBar progressBar;
    private Bitmap selectedImage;

    // Replace with your server IP
    private static final String API_URL = "http://YOUR_SERVER_IP:5000/api/v1/predict";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        setupListeners();
    }

    private void initViews() {
        imageView = findViewById(R.id.imageView);
        btnCamera = findViewById(R.id.btnCamera);
        btnGallery = findViewById(R.id.btnGallery);
        btnAnalyze = findViewById(R.id.btnAnalyze);
        tvDisease = findViewById(R.id.tvDisease);
        tvConfidence = findViewById(R.id.tvConfidence);
        tvSeverity = findViewById(R.id.tvSeverity);
        tvTreatment = findViewById(R.id.tvTreatment);
        progressBar = findViewById(R.id.progressBar);
    }

    private void setupListeners() {
        btnCamera.setOnClickListener(v -> openCamera());
        btnGallery.setOnClickListener(v -> openGallery());
        btnAnalyze.setOnClickListener(v -> analyzeImage());
    }

    private void openCamera() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        } else {
            Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            startActivityForResult(cameraIntent, CAMERA_REQUEST);
        }
    }

    private void openGallery() {
        Intent galleryIntent = new Intent(Intent.ACTION_PICK,
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        startActivityForResult(galleryIntent, GALLERY_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (resultCode == RESULT_OK) {
            try {
                if (requestCode == CAMERA_REQUEST) {
                    selectedImage = (Bitmap) data.getExtras().get("data");
                    imageView.setImageBitmap(selectedImage);
                    btnAnalyze.setEnabled(true);
                } else if (requestCode == GALLERY_REQUEST) {
                    Uri selectedImageUri = data.getData();
                    selectedImage = MediaStore.Images.Media.getBitmap(
                            this.getContentResolver(), selectedImageUri);
                    imageView.setImageBitmap(selectedImage);
                    btnAnalyze.setEnabled(true);
                }
            } catch (IOException e) {
                Toast.makeText(this, "Error loading image", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void analyzeImage() {
        if (selectedImage == null) {
            Toast.makeText(this, "Please select an image first", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnAnalyze.setEnabled(false);

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        selectedImage.compress(Bitmap.CompressFormat.JPEG, 90, stream);
        byte[] byteArray = stream.toByteArray();

        OkHttpClient client = new OkHttpClient();
        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", "image.jpg",
                        RequestBody.create(MediaType.parse("image/jpeg"), byteArray))
                .build();

        Request request = new Request.Builder()
                .url(API_URL)
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnAnalyze.setEnabled(true);
                    Toast.makeText(MainActivity.this,
                            "Network error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                String responseBody = response.body().string();

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnAnalyze.setEnabled(true);

                    try {
                        JSONObject json = new JSONObject(responseBody);
                        JSONObject prediction = json.getJSONObject("prediction");
                        JSONObject severity = json.getJSONObject("severity");
                        JSONObject treatment = json.getJSONObject("treatment");

                        String disease = prediction.getString("disease");
                        double confidence = prediction.getDouble("confidence");
                        String severityLevel = severity.getString("level");

                        tvDisease.setText("Disease: " + disease);
                        tvConfidence.setText("Confidence: " + String.format("%.1f%%", confidence));
                        tvSeverity.setText("Severity: " + severityLevel);

                        // Get treatment info
                        JSONObject chemical = treatment.getJSONObject("chemical");
                        String treatmentText = "Chemical: " + chemical.optString("name", "N/A");
                        tvTreatment.setText(treatmentText);

                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this,
                                "Error parsing response", Toast.LENGTH_SHORT).show();
                    }
                });
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                openCamera();
            } else {
                Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
