<script setup lang="ts">
import Badge from '../ui/badge/Badge.vue'
</script>

<template>
    <footer class="shrink-0 border-t border-border">
        <div class="w-full flex flex-start max-w-screen-xl px-4 pt-4 py-2 md:flex md:items-center md:justify-between">

            <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <!--
                  Prima c'era `rounded-md ... rounded-xl` insieme: la seconda
                  vinceva sempre e rendeva morta la prima. Un badge di
                  versione è un chip, quindi rounded-full è la scelta
                  corretta (non un valore a caso preso dalla scala 8/12/16).
                -->
                <Badge
                    variant="outline"
                    class="inline-flex items-center rounded-full border-border bg-accent px-2 py-1 text-xs font-medium text-muted-foreground"
                >
                    v0.0.1
                </Badge>

                <span class="text-muted-foreground/50">|</span>

                made with heart and claude
            </div>

              <ul class="flex flex-wrap items-center mt-3 text-sm font-medium text-muted-foreground sm:mt-0 gap-2">
                <li>
                    <a href="https://codeberg.org/reverb6821/nebula-dock/src/branch/main" target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                        title="Repository su Codeberg"
                        aria-label="Repository su Codeberg">
                        <svg class="h-4 w-4 fill-current" role="img" viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <title>Codeberg</title>
                            <path
                                d="M11.999.747A11.974 11.974 0 0 0 0 12.75c0 2.254.635 4.465 1.833 6.376L11.837 6.19c.072-.092.251-.092.323 0l4.178 5.402h-2.992l.065.239h3.113l.882 1.138h-3.674l.103.374h3.86l.777 1.003h-4.358l.135.483h4.593l.695.894h-5.038l.165.589h5.326l.609.785h-5.717l.182.65h6.038l.562.727h-6.397l.183.65h6.717A12.003 12.003 0 0 0 24 12.75 11.977 11.977 0 0 0 11.999.747zm3.654 19.104.182.65h5.326c.173-.204.353-.433.513-.65zm.385 1.377.18.65h3.563c.233-.198.485-.428.712-.65zm.383 1.377.182.648h1.203c.356-.204.685-.412 1.042-.648zz" />
                        </svg>
                    </a>
                </li>
                <li>
                    <a href="https://mastodon.uno/@reverb6821" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                        title="Mastodon"
                        aria-label="Mastodon">
                        <svg class="h-4 w-4 fill-current" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <title>Mastodon</title>
                            <path
                                d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
                        </svg>
                    </a>
                </li>
            </ul>

        </div>
    </footer>
</template>