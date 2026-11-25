# Snapshot de CPU e memória

Containers: projeto Compose isolado `avalia-spec019`, backend Rails de teste. Uma amostra logo após benchmark registrou aproximadamente **16,58% CPU** e **354,1 MiB / 15,52 GiB**. Uma amostra posterior em idle registrou **0,02% CPU** e **354,8 MiB / 15,52 GiB**.

São snapshots instantâneos, não média nem peak; não existe snapshot pre-refactor comparável. Não medimos PSS, RSS por worker, pico durante build, cold start ou carga concorrente. Eles não validam orçamento de memória da VM de produção.
