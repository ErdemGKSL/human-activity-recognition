| Koşu | Model | Yapılandırma | OOF macro F1 | Aktivite F1 | Transition F1 |
|---|---|---|---|---|---|
| a0_cnn | cnn | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.807 ± 0.006 | 0.923 | 0.691 |
| a0_gru | gru | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.776 ± 0.017 | 0.900 | 0.652 |
| a0_lstm | lstm | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.768 ± 0.006 | 0.882 | 0.654 |
| a0_mlp | mlp | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.824 ± 0.004 | 0.925 | 0.723 |
| a1a_mlp | mlp | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.845 ± 0.004 | 0.933 | 0.756 |
| a1b_mlp | mlp | ep100 lr0.002 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.844 ± 0.003 | 0.932 | 0.756 |
| g_cnn | cnn | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=1 step=64 aug=0 cw=full var=base | 0.827 ± 0.013 | 0.936 | 0.717 |
| g_lstm | lstm | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=1 step=64 aug=0 cw=full var=base | 0.781 ± 0.019 | 0.911 | 0.652 |
| p_mm_lstm | lstm | ep100 lr0.001 wu3 clip1 pool=meanmax bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.763 ± 0.004 | 0.898 | 0.627 |
