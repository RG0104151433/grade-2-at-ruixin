char nextGreatestLetter(char* letters, int lettersSize, char target) {
    if (target>=letters[lettersSize-1]) return letters[0];
    int left=0,right=lettersSize-1;
    while (left<right) {
        int mid=left+(right-left)/2;
        if (letters[mid]>target) right=mid;
        else left=mid+1;
    }
    return letters[left];
}
