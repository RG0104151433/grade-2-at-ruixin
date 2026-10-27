bool isSymmetric(struct TreeNode* root) {
    return isSame(root->left,root->right);
}
bool isSame(struct TreeNode* p, struct TreeNode* q) {
    if (p==NULL || q==NULL) return p==q;
    else return p->val==q->val && isSame(p->left,q->right) && isSame(q->left,p->right);
}
