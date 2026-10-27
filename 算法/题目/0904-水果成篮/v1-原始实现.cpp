int totalFruit(int* fruits, int fruitsSize) {
    int ans=0,left=0,a=fruits[left],b=-1;
    for (int right=0; right<fruitsSize; right++) {
        if (fruits[right]!=a && b==-1) b=fruits[right];
        else if (fruits[right]!=a && fruits[right]!=b) {
            left=right-1;
            while (fruits[left-1]==fruits[right-1]) left--;
            a=fruits[left];
            b=fruits[right];
            continue;
        }
        ans=right-left+1>ans?right-left+1:ans;
    }
    return ans;
}
