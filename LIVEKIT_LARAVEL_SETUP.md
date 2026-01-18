# Laravel LiveKit Token Setup

To securely generate tokens for your React frontend, follow these steps in your Laravel project.

## 1. Install JWT Library

Since LiveKit tokens are signed JWTs, you can use the `firebase/php-jwt` library.

```bash
composer require firebase/php-jwt
```

## 2. Update `.env`

Add your LiveKit credentials to your Laravel `.env` file:

```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

## 3. Create LiveKit Controller

Create a new controller `app/Http/Controllers/LiveKitController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Firebase\JWT\JWT;

class LiveKitController extends Controller
{
    public function getToken(Request $request)
    {
        $request->validate([
            'room' => 'required|string',
            'identity' => 'required|string',
        ]);

        $apiKey = env('LIVEKIT_API_KEY');
        $apiSecret = env('LIVEKIT_API_SECRET');

        $payload = [
            'iss' => $apiKey,
            'nbf' => time(),
            'iat' => time(),
            'exp' => time() + 3600, // Token valid for 1 hour
            'video' => [
                'room' => $request->room,
                'roomJoin' => true,
                'canPublish' => true,
                'canSubscribe' => true,
            ],
            'sub' => $request->identity,
            'name' => $request->identity,
            // Add metadata if needed for admin checks
            'metadata' => $request->metadata ?? '',
        ];

        $token = JWT::encode($payload, $apiSecret, 'HS256');

        return response()->json([
            'token' => $token
        ]);
    }
}
```

## 4. Define API Route

Add the route to `routes/api.php`:

```php
use App\Http\Controllers\LiveKitController;

Route::post('/livekit/token', [LiveKitController.php, 'getToken']);
```

## 5. Summary of Changes in React

The React app is now configured to call this endpoint:
- **Endpoint**: `${import.meta.env.VITE_API_URL}/api/livekit/token`
- **Body**: `{ room: string, identity: string, isAdmin: boolean, metadata: string }`
