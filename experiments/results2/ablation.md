| Koşu | Model | Yapılandırma | OOF macro F1 | Aktivite F1 | Transition F1 |
|---|---|---|---|---|---|
| a0_cnn | cnn | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.807 ± 0.006 | 0.923 | 0.691 |
| a0_gru | gru | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.776 ± 0.017 | 0.900 | 0.652 |
| a0_lstm | lstm | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.768 ± 0.006 | 0.882 | 0.654 |
| a0_mlp | mlp | ep40 lr0.002 wu0 clip0 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.824 ± 0.004 | 0.925 | 0.723 |
| a1a_cnn | cnn | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.809 ± 0.003 | 0.928 | 0.689 |
| a1a_gru | gru | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.767 ± 0.020 | 0.905 | 0.628 |
| a1a_lstm | lstm | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.771 ± 0.009 | 0.898 | 0.644 |
| a1a_mlp | mlp | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.845 ± 0.004 | 0.933 | 0.756 |
| a1b_cnn | cnn | ep100 lr0.002 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.822 ± 0.007 | 0.929 | 0.715 |
| a1b_gru | gru | ep100 lr0.002 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.779 ± 0.015 | 0.909 | 0.649 |
| a1b_lstm | lstm | ep100 lr0.002 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.797 ± 0.004 | 0.911 | 0.683 |
| a1b_mlp | mlp | ep100 lr0.002 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.844 ± 0.003 | 0.932 | 0.756 |
| g_cnn | cnn | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=1 step=64 aug=0 cw=full var=base | 0.827 ± 0.013 | 0.936 | 0.717 |
| g_gru | gru | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=1 step=64 aug=0 cw=full var=base | 0.764 ± 0.009 | 0.917 | 0.610 |
| g_lstm | lstm | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=1 step=64 aug=0 cw=full var=base | 0.781 ± 0.019 | 0.911 | 0.652 |
| g_mlpraw | mlpraw | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=1 step=64 aug=0 cw=full var=base | 0.808 ± 0.003 | 0.907 | 0.709 |
| p_mm_gru | gru | ep100 lr0.001 wu3 clip1 pool=meanmax bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.767 ± 0.011 | 0.913 | 0.621 |
| p_mm_lstm | lstm | ep100 lr0.001 wu3 clip1 pool=meanmax bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.763 ± 0.004 | 0.898 | 0.627 |
| p_mmbi_gru | gru | ep100 lr0.001 wu3 clip1 pool=meanmax bi=1 grav=0 step=64 aug=0 cw=full var=base | 0.789 ± 0.020 | 0.911 | 0.668 |
| p_mmbi_lstm | lstm | ep100 lr0.001 wu3 clip1 pool=meanmax bi=1 grav=0 step=64 aug=0 cw=full var=base | 0.787 ± 0.015 | 0.903 | 0.672 |
| raw6_mlpraw | mlpraw | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=base | 0.803 ± 0.004 | 0.902 | 0.705 |
| v_deep_cnn | cnn | ep100 lr0.001 wu3 clip1 pool=last bi=0 grav=0 step=64 aug=0 cw=full var=deep | 0.830 ± 0.017 | 0.935 | 0.725 |
