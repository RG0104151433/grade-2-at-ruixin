int minimumRecolors(char* blocks, int k) {
     int n=strlen(blocks),b=0,max=0;
     for (int i=0;i<n;i++) {
         if (blocks[i]=='B') b++;
         if (i>=k && blocks[i-k]=='B') b--;
         if (i>=k-1 && b>max) max=b;
     }
     return k-max;
}
