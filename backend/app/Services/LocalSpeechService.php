<?php

namespace App\Services;

use App\Models\Donation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;

final class LocalSpeechService
{
    public function donationSpeechPath(Donation $donation): string
    {
        $name = Str::limit(strip_tags(trim((string) $donation->name)), 80, '');
        $message = Str::limit(strip_tags(trim((string) $donation->message)), 300);
        $amount = $this->numberToWords((int) $donation->amount);
        $text = ucfirst("{$amount} dari {$name}.");

        if ($message !== '') {
            $text .= " Pesan: {$message}";
        } else {
            $text .= ' Tanpa pesan.';
        }

        return $this->speechPath('donation-'.$donation->id, $text);
    }

    public function previewSpeechPath(): string
    {
        return $this->speechPath(
            'preview-donation',
            'Lima puluh ribu dari Donatur Johen. Pesan: semangat terus live-nya!',
        );
    }

    private function numberToWords(int $number): string
    {
        $words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

        return match (true) {
            $number < 0 => 'minus '.$this->numberToWords(abs($number)),
            $number < 12 => $words[$number],
            $number < 20 => $this->numberToWords($number - 10).' belas',
            $number < 100 => trim($this->numberToWords(intdiv($number, 10)).' puluh '.$this->numberToWords($number % 10)),
            $number < 200 => trim('seratus '.$this->numberToWords($number - 100)),
            $number < 1000 => trim($this->numberToWords(intdiv($number, 100)).' ratus '.$this->numberToWords($number % 100)),
            $number < 2000 => trim('seribu '.$this->numberToWords($number - 1000)),
            $number < 1000000 => trim($this->numberToWords(intdiv($number, 1000)).' ribu '.$this->numberToWords($number % 1000)),
            $number < 1000000000 => trim($this->numberToWords(intdiv($number, 1000000)).' juta '.$this->numberToWords($number % 1000000)),
            default => (string) $number,
        };
    }

    private function speechPath(string $key, string $text): string
    {
        $path = 'local-speech/'.hash('sha256', $key.'|id-ID-GadisNeural|'.$text).'.mp3';

        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->path($path);
        }

        Cache::lock('local-speech:'.hash('sha256', $key), 30)->block(20, function () use ($path, $text): void {
            if (Storage::disk('local')->exists($path)) {
                return;
            }

            Storage::disk('local')->makeDirectory('local-speech');

            $process = new Process([
                'powershell.exe',
                '-NoProfile',
                '-NonInteractive',
                '-ExecutionPolicy',
                'Bypass',
                '-File',
                base_path('scripts/synthesize-speech.ps1'),
                '-TextBase64',
                base64_encode($text),
                '-OutputPath',
                Storage::disk('local')->path($path),
            ]);
            $process->setTimeout(30)->mustRun();

            if (! Storage::disk('local')->exists($path)) {
                throw new RuntimeException('Audio lokal gagal dibuat.');
            }
        });

        return Storage::disk('local')->path($path);
    }
}
